"use client";

import { cn } from "@/lib/utils";
import Marquee from "react-fast-marquee";
import { CheckCircle2 } from "lucide-react";

interface TrustItem {
  id: string;
  name: string;
  logo: string;
}

const trustItems: TrustItem[] = [
  { id: "1", name: "OpenAI", logo: "OpenAI" },
  { id: "2", name: "Google", logo: "Google" },
  { id: "3", name: "Microsoft", logo: "Microsoft" },
  { id: "4", name: "Amazon", logo: "Amazon" },
  { id: "5", name: "Meta", logo: "Meta" },
  { id: "6", name: "Apple", logo: "Apple" },
];

export function TrustMarquee({ className }: { className?: string }) {
  return (
    <section className={cn("w-full py-12 bg-slate-50 border-y border-slate-200", className)}>
      <div className="content-full">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">已为 10,000+ 创作者提供服务</span>
          </div>
        </div>

        {/* Marquee container with gradient masks */}
        <div className="relative">
          {/* Left gradient mask */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10" />

          {/* Marquee */}
          <Marquee
            pauseOnHover
            gradient={false}
            speed={30}
            className="py-4"
          >
            {trustItems.map((item) => (
              <div
                key={item.id}
                className="mx-8 flex items-center gap-3 group cursor-pointer transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <span className="text-lg font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                    {item.logo.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-900 transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
            {/* Duplicate items for seamless loop */}
            {trustItems.map((item) => (
              <div
                key={`${item.id}-duplicate`}
                className="mx-8 flex items-center gap-3 group cursor-pointer transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <span className="text-lg font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                    {item.logo.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-900 transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
          </Marquee>

          {/* Right gradient mask */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10" />
        </div>
      </div>
    </section>
  );
}
