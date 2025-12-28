import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
        <Sparkles className="w-4 h-4" />
        <span>免费使用，无需注册</span>
      </div>

      <h2 className="text-hero font-bold text-slate-900 mb-6">
        准备好创建您的第一个封面了吗？
      </h2>

      <p className="text-body-xl text-slate-600 max-w-2xl mx-auto mb-10">
        立即开始使用 AI 驱动的封面生成器，让您的社交媒体内容脱颖而出。
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          asChild
          size="lg"
          className="h-14 px-8 text-base font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
        >
          <Link href="/generate">
            立即开始创作
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-14 px-8 text-base font-medium border-slate-200 hover:bg-slate-50"
        >
          <Link href="/generate">查看示例</Link>
        </Button>
      </div>
    </div>
  );
}
