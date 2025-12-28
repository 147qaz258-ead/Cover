"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Zap, Palette, Smartphone, Shield, Sparkles, Clock, Layers, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Feature cards configuration
const features = [
  {
    id: "toggle",
    title: "一键切换",
    description: "在多种风格之间快速切换，找到最适合的设计",
    icon: Wand2,
    span: "col-span-1",
    component: "toggle",
  },
  {
    id: "platforms",
    title: "多平台适配",
    description: "自动适配小红书、微信、抖音等各大平台尺寸",
    icon: Smartphone,
    span: "col-span-2",
    component: "platforms",
  },
  {
    id: "ai",
    title: "AI 智能生成",
    description: "智能分析内容，自动生成匹配的标题和视觉设计",
    icon: Sparkles,
    span: "col-span-1",
    component: "default",
  },
  {
    id: "progress",
    title: "实时预览",
    description: "实时预览生成进度，无需等待",
    icon: Clock,
    span: "col-span-1",
    component: "progress",
  },
  {
    id: "templates",
    title: "海量模板",
    description: "专业设计师精心制作的模板库，持续更新中",
    icon: Palette,
    span: "col-span-1",
    component: "default",
  },
  {
    id: "secure",
    title: "安全可靠",
    description: "企业级安全保障，您的内容永远保密",
    icon: Shield,
    span: "col-span-2",
    component: "default",
  },
];

export function FeatureBentoGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3], [50, 0]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section ref={ref} className="section-gap bg-white">
      <div className="content-full">
        <motion.div
          style={{ opacity, y }}
          className="text-center mb-16"
        >
          <h2 className="text-hero-sm font-bold text-slate-900 mb-4">
            强大的功能
          </h2>
          <p className="text-body-xl text-slate-600 max-w-2xl mx-auto">
            专为内容创作者设计的 AI 封面生成工具
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={item}
              className={cn("relative", feature.span)}
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const Icon = feature.icon;

  return (
    <Card className="h-full border-slate-200/60 hover:border-yellow-200/60 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <CardHeader className="space-y-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="text-slate-900">{feature.title}</CardTitle>
        <CardDescription className="text-body text-slate-600">
          {feature.description}
        </CardDescription>
      </CardHeader>

      {/* Micro-interaction based on component type */}
      <CardContent className="pt-0">
        {feature.component === "toggle" && <ToggleInteraction />}
        {feature.component === "progress" && <ProgressInteraction />}
        {feature.component === "platforms" && <PlatformsList />}
      </CardContent>
    </Card>
  );
}

// Micro-interaction: Toggle
function ToggleInteraction() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
      <span className="text-sm text-slate-600">启用渐变背景</span>
      <Switch
        checked={checked}
        onCheckedChange={setChecked}
        className="data-[state=checked]:bg-yellow-400"
      />
    </div>
  );
}

// Micro-interaction: Progress
function ProgressInteraction() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-500">
        <span>生成进度</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

// Micro-interaction: Platforms list
function PlatformsList() {
  const platforms = [
    { name: "小红书", icon: "📕" },
    { name: "微信", icon: "💬" },
    { name: "抖音", icon: "🎵" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <motion.div
          key={platform.name}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm cursor-pointer"
        >
          <span>{platform.icon}</span>
          <span className="text-xs font-medium text-slate-700">{platform.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
