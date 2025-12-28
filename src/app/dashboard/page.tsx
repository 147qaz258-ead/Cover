// Dashboard Page
// User dashboard with subscription and usage information

import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { UsageDisplay } from "@/components/user/usage-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Award } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">欢迎回来，{session.user.name || session.user.email}!</h1>
        <p className="text-muted-foreground mt-2">这是您的个人控制台</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Usage Card */}
        <UsageDisplay />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              快速开始
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/generate"
              className="block p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <div className="font-medium">创建新封面</div>
              <div className="text-sm text-muted-foreground">开始生成 AI 封面</div>
            </a>
            <a
              href="/gallery"
              className="block p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <div className="font-medium">我的作品</div>
              <div className="text-sm text-muted-foreground">查看已生成的封面</div>
            </a>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              订阅信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              管理您的订阅计划和支付方式
            </div>
            <a
              href="/pricing"
              className="inline-block mt-3 text-sm text-primary hover:underline"
            >
              查看所有计划 →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
