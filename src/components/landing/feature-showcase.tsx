import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Zap, Smartphone } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "智能分析",
    description: "AI 自动分析您的文章内容，提取关键信息，生成匹配的标题和视觉风格。",
  },
  {
    icon: Palette,
    title: "多种风格",
    description: "支持扁平插画、水彩手绘、日系动漫、写实产品等多种视觉风格模板。",
  },
  {
    icon: Smartphone,
    title: "平台适配",
    description: "一键生成适配小红书、微信、抖音、淘宝等各大社交媒体平台的封面尺寸。",
  },
];

export function FeatureShowcase() {
  return (
    <div className="text-center">
      <h2 className="text-hero-sm font-bold text-slate-900 mb-4">
        强大的 AI 能力
      </h2>
      <p className="text-body-lg text-slate-600 mb-12 max-w-2xl mx-auto">
        只需输入文字，AI 即可完成分析、设计、生成的全流程
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="border-slate-200/60 hover:border-violet-200 hover:shadow-lg transition-all duration-300"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-slate-900">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-body-lg text-slate-600">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
