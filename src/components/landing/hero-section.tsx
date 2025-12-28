"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorMockup } from "./editor-mockup";
import { useRouter } from "next/navigation";

export function HeroSection() {
  const router = useRouter();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] as const } },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-200/20 rounded-full blur-3xl" />

      <div className="relative z-10 content-full pt-24 pb-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left: Content */}
          <div className="space-y-8">
            <motion.div variants={item} className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI 驱动的封面生成器</span>
              </div>
              <h1 className="text-hero font-bold tracking-tight text-slate-900">
                一键创建精美
                <br />
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  社交媒体封面
                </span>
              </h1>
              <p className="text-body-xl text-slate-600 max-w-lg">
                智能分析您的文章内容，自动生成适配小红书、微信、抖音等平台的精美封面。
                无需设计经验，只需输入文字，AI 即可完成。
              </p>
            </motion.div>

            <motion.div variants={item} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="输入您的文章内容..."
                  className="h-14 text-base px-6 border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
                <Button
                  size="lg"
                  onClick={() => router.push("/generate")}
                  className="h-14 px-8 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium shadow-lg shadow-yellow-400/25"
                >
                  立即开始
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                按 Enter 键快速生成 · 免费试用 · 无需注册
              </p>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={item} className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white flex items-center justify-center text-white text-sm font-medium"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">10,000+ 创作者</p>
                <p className="text-sm text-slate-500">已使用 Cover 生成封面</p>
              </div>
            </motion.div>
          </div>

          {/* Right: Editor Mockup */}
          <motion.div variants={item} className="relative">
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-200 to-yellow-100 rounded-3xl blur-2xl opacity-50" />
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <EditorMockup />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
