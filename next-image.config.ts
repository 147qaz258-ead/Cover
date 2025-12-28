/** @type {import('next').NextImageConfig} */
const nextImageConfig = {
  // Enable modern image formats
  formats: ["image/webp", "image/avif"],

  // Device sizes for responsive images
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

  // Image sizes for srcset
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],

  // Quality settings
  quality: 85,

  // Minimum cache TTL (in seconds)
  minimumCacheTTL: 86400, // 24 hours

  // Enable dangerously allow SVG for Next.js Image component
  dangerouslyAllowSVG: false,

  // Content Security Policy for Next.js Image component
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

  // Content disposition type
  contentDispositionType: "inline",

  // Loader file for custom image loading
  loaderFile: "",

  // Disable static imports for Next.js Image component
  disableStaticImages: false,

  // Enable blur placeholders
  blurDataURL: "",
  blurWidth: 20,
  blurHeight: 20,

  // Loader configuration
  loader: "default",

  // Path prefix for external images
  path: "",

  // Domain whitelist for external images
  domains: [
    // Add your Cloudflare R2 domain
    process.env.CLOUDFLARE_R2_PUBLIC_URL ? new URL(process.env.CLOUDFLARE_R2_PUBLIC_URL).hostname : undefined,
    // Add other allowed domains
    "localhost",
  ].filter(Boolean) as string[],

  // Remote patterns for dynamic external images
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**.r2.dev",
    },
    {
      protocol: "https",
      hostname: "**.cloudflare.com",
    },
    {
      protocol: "https",
      hostname: "**.vercel.app",
    },
  ],

  // Unoptimized domains
  unoptimized: false,
};

export default nextImageConfig;