"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CanvasEditor } from "@/components/editor/canvas-editor";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Platform } from "@/types";

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: string;
}
import { motion } from "framer-motion";

interface Template {
  id: string;
  name: string;
  description: string;
  platform: Platform;
  previewText: string;
  gradient: string;
}

const TEMPLATES: Template[] = [
  {
    id: "minimal-clean",
    name: "简约清新",
    description: "适合知识分享、干货教程",
    platform: {
      id: "xiaohongshu",
      name: "小红书",
      aspectRatio: "1:1",
      dimensions: { width: 1080, height: 1080 },
      maxFileSize: 5 * 1024 * 1024,
      supportedFormats: ["png", "jpg", "webp"],
    },
    previewText: "10个提高效率的方法\n让你的工作事半功倍",
    gradient: "from-yellow-400 via-yellow-500 to-orange-500",
  },
  {
    id: "vibrant-bold",
    name: "活力醒目",
    description: "适合促销活动、新品发布",
    platform: {
      id: "douyin",
      name: "抖音",
      aspectRatio: "9:16",
      dimensions: { width: 1080, height: 1920 },
      maxFileSize: 5 * 1024 * 1024,
      supportedFormats: ["png", "jpg", "webp"],
    },
    previewText: "限时优惠\n全场5折起",
    gradient: "from-pink-500 via-red-500 to-orange-500",
  },
  {
    id: "elegant-serif",
    name: "优雅高端",
    description: "适合品牌宣传、高端内容",
    platform: {
      id: "wechat",
      name: "微信公众号",
      aspectRatio: "16:9",
      dimensions: { width: 900, height: 500 },
      maxFileSize: 5 * 1024 * 1024,
      supportedFormats: ["png", "jpg", "webp"],
    },
    previewText: "品质生活\n从细节开始",
    gradient: "from-slate-700 via-slate-800 to-slate-900",
  },
];

interface EditorShowcaseProps {
  onGetStarted?: () => void;
  className?: string;
}

export function EditorShowcase({ onGetStarted, className }: EditorShowcaseProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);

  // Generate a simple placeholder image for demo
  const placeholderImage = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${selectedTemplate.platform.dimensions.width}" height="${selectedTemplate.platform.dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${selectedTemplate.gradient.includes('yellow') ? '#FCD34D' : selectedTemplate.gradient.includes('pink') ? '#EC4899' : '#334155'};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${selectedTemplate.gradient.includes('orange') ? '#F97316' : selectedTemplate.gradient.includes('red') ? '#EF4444' : '#0F172A'};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="40%" text-anchor="middle" fill="white" font-size="48" font-family="Arial">${selectedTemplate.previewText.split('\\n')[0]}</text>
      <text x="50%" y="55%" text-anchor="middle" fill="white" font-size="32" font-family="Arial">${selectedTemplate.previewText.split('\\n')[1] || ''}</text>
    </svg>
  `)}`;

  const demoTexts: TextElement[] = [
    {
      id: "title",
      text: selectedTemplate.previewText.split("\n")[0] || "标题",
      x: selectedTemplate.platform.dimensions.width / 2 - 100,
      y: selectedTemplate.platform.dimensions.height * 0.3,
      fontSize: 48,
      fontFamily: "Arial",
      fontWeight: "bold",
      color: "#FFFFFF",
      textAlign: "center",
    },
    {
      id: "subtitle",
      text: selectedTemplate.previewText.split("\n")[1] || "副标题",
      x: selectedTemplate.platform.dimensions.width / 2 - 100,
      y: selectedTemplate.platform.dimensions.height * 0.45,
      fontSize: 32,
      fontFamily: "Arial",
      fontWeight: "normal",
      color: "#FFFFFF",
      textAlign: "center",
    },
  ];

  return (
    <section className={cn("section-gap bg-slate-50", className)}>
      <div className="content-full">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-yellow-100 text-yellow-800 border-yellow-200">
            <Sparkles className="w-3 h-3 mr-1" />
            交互演示
          </Badge>
          <h2 className="text-hero-sm font-bold text-slate-900 mb-4">
            体验强大的编辑功能
          </h2>
          <p className="text-body-xl text-slate-600 max-w-2xl mx-auto">
            拖拽文字、调整样式、实时预览 —— 所见即所得的编辑体验
          </p>
        </div>

        {/* Editor Showcase */}
        <div className="grid lg:grid-cols-[1fr_350px] gap-8 items-start">
          {/* Editor Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Simple demo editor view */}
            <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                    <span className="text-xs text-white">T</span>
                  </div>
                  <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                    <span className="text-xs text-white">I</span>
                  </div>
                </div>
                <div className="flex-1 h-6 bg-slate-700/50 rounded" />
              </div>
              <div className="aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={placeholderImage}
                  alt={selectedTemplate.name}
                  className="w-full h-full object-contain transition-all duration-500"
                  key={selectedTemplate.id}
                />
              </div>
            </div>

            {/* Properties Panel Demo */}
            <div className="p-4 bg-slate-50 border-t">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">字体大小</span>
                  <span className="font-medium text-slate-900">48px</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-yellow-400 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white border-2 border-yellow-400" />
                  <div className="w-6 h-6 rounded bg-white border-2 border-slate-300" />
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-transparent" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Template Selector */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-slate-900">选择模板风格</h3>

            {TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  selectedTemplate.id === template.id
                    ? "ring-2 ring-yellow-400 shadow-lg"
                    : "hover:ring-1 hover:ring-slate-300"
                )}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div
                      className={cn(
                        "w-16 h-16 rounded-lg flex-shrink-0 bg-gradient-to-br",
                        template.id === "minimal-clean" && "from-yellow-400 to-yellow-600",
                        template.id === "vibrant-bold" && "from-pink-500 to-red-500",
                        template.id === "elegant-serif" && "from-slate-600 to-slate-800"
                      )}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 mb-1">
                        {template.name}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.platform.name}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {template.platform.dimensions.width}×{template.platform.dimensions.height}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={onGetStarted}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium shadow-lg shadow-yellow-400/25"
            >
              开始创作
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Tips */}
            <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg">
              💡 提示：选择模板后，您可以自由拖拽文字、调整样式
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default EditorShowcase;
