import { Head } from "next/document";
import { Metadata } from "next";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
  siteName?: string;
  locale?: string;
  alternateUrls?: Record<string, string>; // language -> url
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
  structuredData?: Record<string, any>[];
}

/**
 * Component for rendering comprehensive SEO meta tags
 */
export function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  siteName = "AI Cover Generator",
  locale = "zh_CN",
  alternateUrls,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noIndex = false,
  canonical,
  structuredData = [],
}: SEOHeadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cover-generator.com";
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullImage = image ? (image.startsWith("http") ? image : `${baseUrl}${image}`) : undefined;

  // Default structured data for AI Cover Generator
  const defaultStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": siteName,
      "description": description || "AI驱动的封面生成工具，支持多平台一键生成精美封面",
      "url": baseUrl,
      "applicationCategory": "DesignApplication",
      "operatingSystem": "Any",
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
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": siteName,
      "description": description || "AI驱动的封面生成工具，支持多平台一键生成精美封面",
      "url": baseUrl,
      "applicationCategory": "DesignApplication",
      "operatingSystem": "Web",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150"
      }
    }
  ];

  // Combine default and custom structured data
  const allStructuredData = [...defaultStructuredData, ...structuredData];

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{title ? `${title} | ${siteName}` : siteName}</title>
      <meta name="description" content={description || "AI驱动的封面生成工具，支持多平台一键生成精美封面"} />
      {keywords && <meta name="keywords" content={keywords.join(", ")} />}
      {author && <meta name="author" content={author} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <meta name="googlebot" content={noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      {!canonical && url && <link rel="canonical" href={fullUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || siteName} />
      <meta property="og:description" content={description || "AI驱动的封面生成工具，支持多平台一键生成精美封面"} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {fullImage && <meta property="og:image" content={fullImage} />}
      {fullImage && <meta property="og:image:alt" content={title || siteName} />}
      {fullImage && <meta property="og:image:type" content="image/webp" />}
      {fullImage && <meta property="og:image:width" content="1200" />}
      {fullImage && <meta property="og:image:height" content="630" />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || siteName} />
      <meta name="twitter:description" content={description || "AI驱动的封面生成工具，支持多平台一键生成精美封面"} />
      <meta name="twitter:url" content={fullUrl} />
      {fullImage && <meta name="twitter:image" content={fullImage} />}
      <meta name="twitter:creator" content="@aicovergen" />
      <meta name="twitter:site" content="@aicovergen" />

      {/* Article specific tags */}
      {type === "article" && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags && tags.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
        </>
      )}

      {/* Alternate language URLs */}
      {alternateUrls &&
        Object.entries(alternateUrls).map(([lang, url]) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={url} />
        ))}
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Manifest */}
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#000000" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(allStructuredData),
        }}
      />

      {/* Additional meta tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </>
  );
}

/**
 * Generate metadata for Next.js App Router
 */
export function generateSEO_metadata(props: SEOHeadProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cover-generator.com";
  const fullUrl = props.url ? `${baseUrl}${props.url}` : baseUrl;
  const fullImage = props.image ? (props.image.startsWith("http") ? props.image : `${baseUrl}${props.image}`) : undefined;

  const metadata: Metadata = {
    title: props.title ? `${props.title} | AI Cover Generator` : "AI Cover Generator",
    description: props.description || "AI驱动的封面生成工具，支持多平台一键生成精美封面",
    keywords: props.keywords?.join(", "),
    authors: props.author ? [{ name: props.author }] : undefined,
    robots: props.noIndex ? "noindex, nofollow" : "index, follow",
    openGraph: {
      type: props.type,
      title: props.title || "AI Cover Generator",
      description: props.description || "AI驱动的封面生成工具，支持多平台一键生成精美封面",
      url: fullUrl,
      siteName: "AI Cover Generator",
      locale: props.locale,
      images: fullImage
        ? [
          {
            url: fullImage,
            width: 1200,
            height: 630,
            alt: props.title || "AI Cover Generator",
          },
        ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: props.title || "AI Cover Generator",
      description: props.description || "AI驱动的封面生成工具，支持多平台一键生成精美封面",
      images: fullImage ? [fullImage] : undefined,
      creator: "@aicovergen",
      site: "@aicovergen",
    },
    alternates: {
      canonical: props.canonical || fullUrl,
      languages: props.alternateUrls,
    },
  };

  // Add article specific metadata
  if (props.type === "article") {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: "article" as const,
      publishedTime: props.publishedTime,
      modifiedTime: props.modifiedTime,
      authors: props.author ? [props.author] : undefined,
      section: props.section,
      tags: props.tags,
    };
  }

  return metadata;
}

/**
 * Default SEO configuration
 */
export const defaultSEO = {
  title: "AI Cover Generator",
  description: "AI驱动的封面生成工具，支持多平台一键生成精美封面。智能文本分析、多平台适配、无限画布编辑。",
  keywords: [
    "AI封面生成",
    "封面设计",
    "小红书封面",
    "微信封面",
    "抖音封面",
    "AI设计工具",
    "多平台封面",
    "智能生成",
    "封面模板",
  ],
  image: "/og-image.jpg",
  type: "website" as const,
  siteName: "AI Cover Generator",
  locale: "zh_CN",
};