import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    content: "Cover 让我的内容创作效率提升了 10 倍！再也不用为封面设计发愁了。",
    author: "小红书博主",
    rating: 5,
  },
  {
    content: "生成的封面质量超出预期，风格多样，完美适配各大平台。",
    author: "电商运营",
    rating: 5,
  },
  {
    content: "简单易用，输入文字就能得到专业级别的封面设计，强烈推荐！",
    author: "抖音创作者",
    rating: 5,
  },
];

export function SocialProof() {
  return (
    <div>
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <h2 className="text-hero-sm font-bold text-slate-900 mb-2">
          用户真实反馈
        </h2>
        <p className="text-body-lg text-slate-600">
          已帮助 10000+ 创作者提升内容质量
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((item, index) => (
          <Card
            key={index}
            className="border-slate-200/60 bg-white hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-6">
              <Quote className="w-8 h-8 text-violet-200 mb-4" />
              <p className="text-body text-slate-700 mb-6">{item.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {item.author}
                </span>
                <div className="flex items-center gap-0.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
