// User Usage History API
// Returns usage records and summary

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthOffset = parseInt(searchParams.get("month") || "0"); // 0 = current month
    const limit = parseInt(searchParams.get("limit") || "50");

    // Calculate target month
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthOffset);

    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

    // Fetch usage records
    const records = await prisma.usageRecord.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Aggregate by type
    const summary = records.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + record.quantity;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        month: targetDate.toLocaleString("zh-CN", { year: "numeric", month: "long" }),
        startDate,
        endDate,
        records,
        summary,
        total: records.length,
      },
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
