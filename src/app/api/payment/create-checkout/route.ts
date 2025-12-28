// Stripe Checkout API
// Creates a Stripe Checkout session for plan purchase

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getStripe, PRICES } from "@/lib/payment/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { planType, billingCycle = "monthly" } = await request.json();

    // Validate request
    if (!planType) {
      return NextResponse.json(
        { success: false, error: "planType is required" },
        { status: 400 }
      );
    }

    if (planType === "FREE") {
      return NextResponse.json(
        { success: false, error: "Cannot checkout for free plan" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      // Update subscription with customer ID
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Get price ID
    const priceKey = `${planType}_${billingCycle.toUpperCase()}` as keyof typeof PRICES;
    const priceId = PRICES[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { success: false, error: "Invalid plan configuration" },
        { status: 400 }
      );
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment", // One-time payment (not subscription)
      payment_method_types: ["card", "alipay"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: session.user.id,
        planType,
        billingCycle,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
