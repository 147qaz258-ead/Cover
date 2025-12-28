// Payment Success Page
// Displayed after successful Stripe checkout

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Verify payment session
    if (sessionId) {
      // In production, you might want to verify the session with an API call
      setIsVerified(true);
    }
  }, [sessionId]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">支付成功！</CardTitle>
          <CardDescription>
            {isVerified
              ? "您的订阅已激活，现在可以开始使用所有功能了。"
              : "感谢您的购买！"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">交易 ID</p>
            <p className="font-mono text-xs">{sessionId || "处理中..."}</p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/generate">
                <Sparkles className="mr-2 h-4 w-4" />
                开始创建封面
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gallery">查看我的作品</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
