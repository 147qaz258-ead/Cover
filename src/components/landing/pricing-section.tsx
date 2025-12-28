"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "免费版",
    description: "适合个人用户试用",
    price: { monthly: 0, yearly: 0 },
    features: [
      "每月 10 次生成",
      "基础模板库",
      "标准画质导出",
      "社区支持",
    ],
    cta: "开始使用",
    highlighted: false,
  },
  {
    id: "pro",
    name: "专业版",
    description: "适合内容创作者",
    price: { monthly: 29, yearly: 24 },
    features: [
      "无限次生成",
      "全部模板库",
      "高清 4K 导出",
      "优先客服支持",
      "无水印导出",
      "批量生成",
    ],
    cta: "立即升级",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "企业版",
    description: "适合团队和企业",
    price: { monthly: 99, yearly: 79 },
    features: [
      "无限次生成",
      "专属定制模板",
      "超高清 8K 导出",
      "专属客户经理",
      "API 接入",
      "团队协作功能",
      "品牌定制",
    ],
    cta: "联系销售",
    highlighted: false,
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

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
    <section className="section-gap bg-slate-50">
      <div className="content-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-hero-sm font-bold text-slate-900 mb-4">
            简单透明的定价
          </h2>
          <p className="text-body-xl text-slate-600 max-w-2xl mx-auto mb-8">
            选择最适合您的计划，随时升级或取消
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white rounded-full p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                billingCycle === "yearly"
                  ? "bg-yellow-400 text-yellow-900"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              年付
              <span className="px-2 py-0.5 bg-yellow-500/20 rounded-full text-xs">
                省20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {plans.map((plan) => (
            <motion.div key={plan.id} variants={item}>
              <PricingCard
                plan={plan}
                billingCycle={billingCycle}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  plan: typeof plans[0];
  billingCycle: "monthly" | "yearly";
}

function PricingCard({ plan, billingCycle }: PricingCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;

  const handleCheckout = async () => {
    // Free plan - go directly to generate
    if (plan.id === "free") {
      router.push(session ? "/generate" : "/auth/signin");
      return;
    }

    // Require auth for paid plans
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: plan.id.toUpperCase(),
          billingCycle,
        }),
      });

      const data = await response.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        console.error("Checkout failed:", data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "relative h-full transition-all duration-300",
        plan.highlighted
          ? "border-yellow-400 shadow-xl shadow-yellow-400/10 scale-105"
          : "border-slate-200 hover:shadow-md"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
            最受欢迎
          </span>
        </div>
      )}

      <CardHeader className="space-y-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>

        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900">
              {price === 0 ? "免费" : `¥${price}`}
            </span>
            {price > 0 && (
              <span className="text-slate-500">
                /{billingCycle === "monthly" ? "月" : "月（年付）"}
              </span>
            )}
          </div>
          {billingCycle === "yearly" && price > 0 && (
            <p className="text-xs text-slate-500">
              年付 ¥{plan.price.yearly * 12}，比月付省 ¥{(plan.price.monthly - plan.price.yearly) * 12}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check
                className={cn(
                  "w-5 h-5 shrink-0 mt-0.5",
                  plan.highlighted ? "text-yellow-500" : "text-green-500"
                )}
              />
              <span className="text-sm text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={cn(
            "w-full",
            plan.highlighted
              ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-lg shadow-yellow-400/25"
              : ""
          )}
          variant={plan.highlighted ? "default" : "outline"}
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : plan.cta}
        </Button>
      </CardContent>
    </Card>
  );
}
