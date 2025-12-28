// Usage Display Component
// Shows user's subscription plan and usage quota

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard, TrendingUp } from "lucide-react";

interface UsageData {
  subscription: {
    id: string;
    planType: string;
    status: string;
    currentPeriodEnd: string | null;
  };
  quota: {
    limit: number;
    used: number;
    remaining: number;
    resetAt: string;
  };
}

const PLAN_NAMES = {
  FREE: "免费版",
  PRO: "专业版",
  ENTERPRISE: "企业版",
};

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/user/subscription");
        const result = await response.json();
        if (result.success) {
          setUsage(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>月度使用量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const { subscription, quota } = usage;
  const percentage = quota.limit === -1 ? 0 : (quota.used / quota.limit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>月度使用量</CardTitle>
        <CardDescription>当前计划: {PLAN_NAMES[subscription.planType as keyof typeof PLAN_NAMES]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{quota.used} 次生成</span>
            <span className="text-muted-foreground">
              {quota.limit === -1 ? "无限制" : `/ ${quota.limit} 次`}
            </span>
          </div>
          {quota.limit !== -1 && (
            <Progress value={percentage} className="h-2" />
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>配额重置</span>
          <span>{new Date(quota.resetAt).toLocaleDateString("zh-CN")}</span>
        </div>

        {quota.limit !== -1 && subscription.planType === "FREE" && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/pricing">
              <CreditCard className="mr-2 h-4 w-4" />
              升级计划
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
