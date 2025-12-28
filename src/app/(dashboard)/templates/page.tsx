"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Palette, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// Visual style categories
const STYLE_CATEGORIES = [
  { id: "all", name: "全部风格" },
  { id: "realistic", name: "写实风格" },
  { id: "illustration", name: "插画风格" },
  { id: "anime", name: "动漫风格" },
  { id: "abstract", name: "抽象风格" },
];

// Visual styles data (sync with API)
const VISUAL_STYLES = [
  {
    id: "realistic-product",
    name: "实物产品风",
    category: "realistic",
    description: "适合产品展示，强调质感与细节",
    preview: "/visual-styles/realistic-product.jpg",
  },
  {
    id: "realistic-food",
    name: "美食实拍风",
    category: "realistic",
    description: "真实诱人的美食呈现",
    preview: "/visual-styles/realistic-food.jpg",
  },
  {
    id: "illustration-flat",
    name: "扁平插画风",
    category: "illustration",
    description: "简洁明快的扁平化设计",
    preview: "/visual-styles/illustration-flat.jpg",
  },
  {
    id: "illustration-watercolor",
    name: "水彩手绘风",
    category: "illustration",
    description: "柔和梦幻的水彩质感",
    preview: "/visual-styles/illustration-watercolor.jpg",
  },
  {
    id: "manga-anime",
    name: "日系动漫风",
    category: "anime",
    description: "活力四射的动漫元素",
    preview: "/visual-styles/manga-anime.jpg",
  },
  {
    id: "abstract-gradient",
    name: "渐变几何风",
    category: "abstract",
    description: "现代感十足的渐变与几何",
    preview: "/visual-styles/abstract-gradient.jpg",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredStyles =
    selectedCategory === "all"
      ? VISUAL_STYLES
      : VISUAL_STYLES.filter((style) => style.category === selectedCategory);

  const handleUseTemplate = (styleId: string) => {
    // Navigate to generate page with pre-selected style
    router.push(`/generate?style=${styleId}`);
    toast.success("已选择模板，开始生成");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/generate">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-violet-600" />
              <h1 className="text-lg font-semibold text-slate-900">视觉风格模板</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Description */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            选择视觉风格
          </h2>
          <p className="text-slate-600">
            不同风格带来不同的视觉感受，选择最适合您内容的风格
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          {STYLE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStyles.map((style) => (
            <Card
              key={style.id}
              className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-slate-200"
              onClick={() => handleUseTemplate(style.id)}
            >
              {/* Preview Image */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img
                  src={style.preview}
                  alt={style.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback if image not found
                    e.currentTarget.src = "/placeholder-template.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-0">
                    点击使用
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1">
                  {style.name}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {style.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            找到喜欢的风格了吗？
          </p>
          <Button size="lg" asChild>
            <Link href="/generate">
              <Sparkles className="w-4 h-4 mr-2" />
              开始生成封面
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
