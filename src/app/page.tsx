"use client";

import { MinimalNavigation } from "@/components/navigation/minimal-navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustMarquee } from "@/components/landing/trust-marquee";
import { FeatureBentoGrid } from "@/components/landing/feature-bento-grid";
import { EditorShowcase } from "@/components/landing/editor-showcase";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";
import Link from "next/link";
import { useRouter } from "next/navigation";

function HomeContent() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/generate");
  };

  return (
    <main className="min-h-screen bg-white">
      <MinimalNavigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Feature Bento Grid */}
      <FeatureBentoGrid />

      {/* Editor Showcase - Interactive Demo */}
      <EditorShowcase onGetStarted={handleGetStarted} />

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="section-gap bg-gradient-to-b from-yellow-50 to-white">
        <div className="content-medium">
          <CTASection />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className="content-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Cover</h3>
              <p className="text-sm text-slate-600">
                AI 驱动的封面生成器，为内容创作者提供专业级设计服务。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-4">产品</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/generate" className="hover:text-yellow-600 transition-colors">
                    创建封面
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-yellow-600 transition-colors">
                    定价
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-yellow-600 transition-colors">
                    功能
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-4">支持</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="#" className="hover:text-yellow-600 transition-colors">
                    帮助中心
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-yellow-600 transition-colors">
                    联系我们
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-yellow-600 transition-colors">
                    隐私政策
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-4">关注我们</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-yellow-100 flex items-center justify-center text-slate-600 hover:text-yellow-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-yellow-100 flex items-center justify-center text-slate-600 hover:text-yellow-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-yellow-100 flex items-center justify-center text-slate-600 hover:text-yellow-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948.073-3.259 0-3.667-.015-4.947-.072-4.354-.2-6.782-2.617-6.979-6.979-.059-1.281-.073-1.69-.073-4.949zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-slate-600 text-sm">
            <p>&copy; {new Date().getFullYear()} Cover. AI 驱动的封面生成器</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return <HomeContent />;
}
