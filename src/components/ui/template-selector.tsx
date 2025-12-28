"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-react";

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  gradient: string;
}

const TEMPLATES: Template[] = [
  {
    id: "minimal-clean",
    name: "简约清新",
    category: "business",
    description: "适合商务、知识分享",
    preview: "linear-gradient(135deg, #FEF3C7 0%, #FBBF24 100%)",
    gradient: "from-yellow-200 to-yellow-500",
  },
  {
    id: "vibrant-bold",
    name: "活力醒目",
    category: "creative",
    description: "适合促销、活动推广",
    preview: "linear-gradient(135deg, #F472B6 0%, #EF4444 100%)",
    gradient: "from-pink-400 to-red-500",
  },
  {
    id: "elegant-serif",
    name: "优雅高端",
    category: "business",
    description: "适合品牌、高端内容",
    preview: "linear-gradient(135deg, #475569 0%, #1E293B 100%)",
    gradient: "from-slate-500 to-slate-800",
  },
  {
    id: "modern-gradient",
    name: "现代渐变",
    category: "creative",
    description: "适合时尚、生活方式",
    preview: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)",
    gradient: "from-purple-400 to-purple-600",
  },
  {
    id: "nature-fresh",
    name: "自然清新",
    category: "lifestyle",
    description: "适合健康、生活方式",
    preview: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    id: "ocean-breeze",
    name: "海洋清新",
    category: "lifestyle",
    description: "适合旅游、休闲内容",
    preview: "linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)",
    gradient: "from-cyan-400 to-cyan-600",
  },
];

const CATEGORIES = [
  { id: "all", name: "全部" },
  { id: "business", name: "商务" },
  { id: "creative", name: "创意" },
  { id: "lifestyle", name: "生活" },
];

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onSelect?: (templateId: string) => void;
  maxDisplay?: number;
  className?: string;
}

export function TemplateSelector({
  selectedTemplate = "minimal-clean",
  onSelect,
  maxDisplay = 6,
  className,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTemplates =
    selectedCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const displayTemplates = filteredTemplates.slice(0, maxDisplay);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">选择模板</h3>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={selectedCategory === cat.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "rounded-full",
              selectedCategory === cat.id && "bg-slate-900 text-white"
            )}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <Card
              key={template.id}
              className={cn(
                "group cursor-pointer transition-all hover:shadow-lg",
                isSelected && "ring-2 ring-yellow-400 shadow-md"
              )}
              onClick={() => onSelect?.(template.id)}
            >
              <CardContent className="p-4">
                {/* Preview */}
                <div
                  className={cn(
                    "aspect-video rounded-lg mb-3 relative overflow-hidden",
                    template.gradient
                  )}
                  style={{ background: template.preview }}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <Check className="w-5 h-5 text-yellow-900" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h4 className="font-medium text-slate-900 text-sm">
                    {template.name}
                  </h4>
                  <p className="text-xs text-slate-600">{template.description}</p>
                </div>

                {/* Category Badge */}
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-200 text-slate-600"
                  >
                    {CATEGORIES.find((c) => c.id === template.category)?.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More */}
      {filteredTemplates.length > maxDisplay && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            查看全部 {filteredTemplates.length} 个模板
          </Button>
        </div>
      )}
    </div>
  );
}

export default TemplateSelector;
