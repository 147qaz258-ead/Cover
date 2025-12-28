// User Subscription API
// Returns current subscription, quota, and usage information

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { QUOTA_LIMITS } from "@/lib/payment/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Create free subscription if none exists
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          planType: "FREE",
          status: "ACTIVE",
        },
      });
    }

    // Get quota limit for current plan
    const quotaLimit = QUOTA_LIMITS[subscription.planType];

    // Calculate usage for this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const used = await prisma.usageRecord.count({
      where: {
        subscriptionId: subscription.id,
        type: "COVER_GENERATION",
        createdAt: { gte: monthStart },
      },
    });

    // Calculate remaining quota
    const remaining = quotaLimit === -1 ? -1 : Math.max(0, quotaLimit - used);

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          planType: subscription.planType,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
        quota: {
          limit: quotaLimit,
          used,
          remaining,
          resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
