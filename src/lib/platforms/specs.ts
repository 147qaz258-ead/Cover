import { Platform } from "@/types";

export const PLATFORMS: Platform[] = [
  {
    id: "xiaohongshu",
    name: "小红书",
    aspectRatio: "3:4",
    dimensions: {
      width: 1080,
      height: 1440,
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ["jpg", "jpeg", "png", "webp"],
  },
  {
    id: "wechat",
    name: "微信公众号",
    aspectRatio: "16:9",
    dimensions: {
      width: 900,
      height: 500,
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ["jpg", "jpeg", "png", "gif"],
  },
  {
    id: "wechat-banner",
    name: "公众号头图",
    aspectRatio: "2.35:1",
    dimensions: {
      width: 900,
      height: 383,
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ["jpg", "jpeg", "png"],
  },
  {
    id: "taobao",
    name: "淘宝/天猫",
    aspectRatio: "1:1",
    dimensions: {
      width: 800,
      height: 800,
    },
    maxFileSize: 3 * 1024 * 1024, // 3MB
    supportedFormats: ["jpg", "jpeg", "png"],
  },
  {
    id: "taobao-banner",
    name: "淘宝横版",
    aspectRatio: "3:2",
    dimensions: {
      width: 1200,
      height: 800,
    },
    maxFileSize: 3 * 1024 * 1024, // 3MB
    supportedFormats: ["jpg", "jpeg", "png"],
  },
  {
    id: "douyin",
    name: "抖音",
    aspectRatio: "9:16",
    dimensions: {
      width: 720,
      height: 1280,
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ["jpg", "jpeg", "png", "webp"],
  },
  {
    id: "weibo",
    name: "微博",
    aspectRatio: "16:9",
    dimensions: {
      width: 1000,
      height: 562,
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
  {
    id: "bilibili",
    name: "B站封面",
    aspectRatio: "16:9",
    dimensions: {
      width: 1920,
      height: 1080,
    },
    maxFileSize: 6 * 1024 * 1024, // 6MB
    supportedFormats: ["jpg", "jpeg", "png"],
  },
  {
    id: "zhihu",
    name: "知乎",
    aspectRatio: "16:9",
    dimensions: {
      width: 738,
      height: 415,
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ["jpg", "jpeg", "png"],
  },
];

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find(platform => platform.id === id);
}

export function getPlatforms(): Platform[] {
  return PLATFORMS;
}

export function getPlatformsByCategory(category: "social" | "ecommerce" | "content"): Platform[] {
  switch (category) {
    case "social":
      return PLATFORMS.filter(p => ["xiaohongshu", "douyin", "weibo"].includes(p.id));
    case "ecommerce":
      return PLATFORMS.filter(p => ["taobao", "taobao-banner"].includes(p.id));
    case "content":
      return PLATFORMS.filter(p => ["wechat", "wechat-banner", "bilibili", "zhihu"].includes(p.id));
    default:
      return PLATFORMS;
  }
}

export function validatePlatformDimensions(platformId: string, width: number, height: number): boolean {
  const platform = getPlatform(platformId);
  if (!platform) return false;

  const ratio = width / height;
  const [expectedWidth, expectedHeight] = platform.aspectRatio.split(":").map(Number);
  const expectedRatio = expectedWidth / expectedHeight;

  // Allow small tolerance for rounding errors
  const tolerance = 0.01;
  return Math.abs(ratio - expectedRatio) < tolerance;
}