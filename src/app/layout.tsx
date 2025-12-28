import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppErrorBoundary } from "@/components/app/app-error-boundary";
import { MobileHeader } from "@/components/layout/navigation";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { generateSEO_metadata } from "@/components/seo/seo-head";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = generateSEO_metadata({
  title: "AI Cover Generator",
  description: "AI驱动的封面生成工具，支持小红书、微信、抖音等多平台一键生成精美封面。智能文本分析、专业设计模板、无限画布编辑。",
  keywords: [
    "AI封面生成",
    "封面设计工具",
    "小红书封面制作",
    "微信公众号封面",
    "抖音封面设计",
    "AI设计助手",
    "社交媒体封面",
    "封面模板库",
    "智能封面生成",
    "多平台适配",
  ],
  image: "/og-image.jpg",
  type: "website",
  locale: "zh_CN",
  alternateUrls: {
    "en": "https://cover-generator.com/en",
    "zh-CN": "https://cover-generator.com",
    "zh-HK": "https://cover-generator.com/hk",
    "zh-TW": "https://cover-generator.com/tw",
  },
  author: "AI Cover Generator Team",
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "AI Cover Generator",
      "description": "AI驱动的封面生成工具，支持多平台一键生成精美封面",
      "url": process.env.NEXT_PUBLIC_APP_URL,
      "applicationCategory": "DesignApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CNY"
      },
      "featureList": [
        "AI智能文本分析",
        "多平台封面生成",
        "无限画布编辑",
        "实时预览",
        "批量导出",
        "专业模板库"
      ],
      "screenshot": `${process.env.NEXT_PUBLIC_APP_URL}/screenshots/app-screenshot.jpg`,
      "softwareVersion": "1.0.0",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "AI Cover Generator",
      "description": "AI驱动的封面生成工具，支持多平台一键生成精美封面",
      "url": process.env.NEXT_PUBLIC_APP_URL,
      "downloadUrl": process.env.NEXT_PUBLIC_APP_URL,
      "applicationCategory": "DesignApplication",
      "operatingSystem": "Web",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CNY"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "首页",
          "item": process.env.NEXT_PUBLIC_APP_URL
        }
      ]
    }
  ]
});

// Viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.openai.com" />
        <link rel="preconnect" href="https://r2.cloudflarestorage.com" />

        {/* DNS prefetch for likely navigation */}
        <link rel="dns-prefetch" href="//xiaohongshu.com" />
        <link rel="dns-prefetch" href="//wechat.com" />
        <link rel="dns-prefetch" href="//douyin.com" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />

        {/* Critical CSS could be inlined here */}
      </head>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MobileHeader />
            <AppErrorBoundary>
              <main className="flex-1">
                {children}
              </main>
            </AppErrorBoundary>
            <Toaster />

            {/* Structured data for app */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "AI Cover Generator",
                "description": "AI驱动的封面生成工具，支持多平台一键生成精美封面",
                "url": process.env.NEXT_PUBLIC_APP_URL,
                "applicationCategory": "DesignApplication",
                "operatingSystem": "Web",
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "CNY"
                },
                "featureList": [
                  "AI智能文本分析",
                  "多平台封面生成",
                  "无限画布编辑",
                  "实时预览",
                  "批量导出"
                ]
              })
            }}
          />
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}