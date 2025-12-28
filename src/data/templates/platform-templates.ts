import { Platform } from "@/types";
import { STYLE_TEMPLATES } from "./index";

export interface PlatformTemplate {
  id: string;
  platformId: string;
  templateId: string;
  name: string;
  description: string;
  adaptations: {
    fontSize?: {
      title: number;
      subtitle: number;
    };
    layout: "center" | "top" | "bottom" | "left" | "right";
    spacing: {
      padding: number;
      lineHeight: number;
      titleSpacing: number;
    };
    elements: {
      showSubtitle?: boolean;
      showWatermark?: boolean;
      cornerRadius?: number;
      borderWidth?: number;
    };
    colors?: {
      backgroundColor?: string;
      textColor?: string;
      accentColor?: string;
    };
  };
}

export const PLATFORM_TEMPLATES: PlatformTemplate[] = [
  // 小红书 templates
  {
    id: "xiaohongshu-minimal-clean",
    platformId: "xiaohongshu",
    templateId: "minimal-clean",
    name: "小红书简约清新",
    description: "适合生活分享、产品种草的清新风格",
    adaptations: {
      fontSize: {
        title: 36,
        subtitle: 24,
      },
      layout: "center",
      spacing: {
        padding: 60,
        lineHeight: 1.4,
        titleSpacing: 20,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 20,
      },
    },
  },
  {
    id: "xiaohongshu-modern-bold",
    platformId: "xiaohongshu",
    templateId: "modern-bold",
    name: "小红书现代醒目",
    description: "突出产品特点的醒目风格",
    adaptations: {
      fontSize: {
        title: 42,
        subtitle: 28,
      },
      layout: "center",
      spacing: {
        padding: 50,
        lineHeight: 1.3,
        titleSpacing: 16,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 16,
      },
    },
  },

  // 小红书竖版 templates
  {
    id: "xiaohongshu-vertical-minimal-clean",
    platformId: "xiaohongshu-vertical",
    templateId: "minimal-clean",
    name: "小红书竖版简约",
    description: "适合详细介绍的竖版设计",
    adaptations: {
      fontSize: {
        title: 32,
        subtitle: 22,
      },
      layout: "center",
      spacing: {
        padding: 80,
        lineHeight: 1.5,
        titleSpacing: 30,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 24,
      },
    },
  },
  {
    id: "xiaohongshu-vertical-elegant-gold",
    platformId: "xiaohongshu-vertical",
    templateId: "elegant-gold",
    name: "小红书竖版轻奢",
    description: "高端产品推荐的奢华风格",
    adaptations: {
      fontSize: {
        title: 38,
        subtitle: 26,
      },
      layout: "center",
      spacing: {
        padding: 70,
        lineHeight: 1.4,
        titleSpacing: 25,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 20,
      },
    },
  },

  // 微信公众号 templates
  {
    id: "wechat-tech-blue",
    platformId: "wechat",
    templateId: "tech-blue",
    name: "公众号科技蓝调",
    description: "适合科技、财经类公众号",
    adaptations: {
      fontSize: {
        title: 44,
        subtitle: 30,
      },
      layout: "center",
      spacing: {
        padding: 100,
        lineHeight: 1.4,
        titleSpacing: 24,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 8,
        borderWidth: 2,
      },
    },
  },
  {
    id: "wechat-business-gray",
    platformId: "wechat",
    templateId: "business-gray",
    name: "公众号商务灰度",
    description: "适合商业、管理类文章",
    adaptations: {
      fontSize: {
        title: 46,
        subtitle: 32,
      },
      layout: "center",
      spacing: {
        padding: 90,
        lineHeight: 1.4,
        titleSpacing: 20,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 8,
      },
    },
  },

  // 微信头图 templates
  {
    id: "wechat-banner-minimal-clean",
    platformId: "wechat-banner",
    templateId: "minimal-clean",
    name: "公众号头图简约",
    description: "简洁大气的公众号头图",
    adaptations: {
      fontSize: {
        title: 52,
        subtitle: 34,
      },
      layout: "center",
      spacing: {
        padding: 40,
        lineHeight: 1.3,
        titleSpacing: 15,
      },
      elements: {
        showSubtitle: false,
        cornerRadius: 4,
      },
    },
  },

  // 淘宝/天猫 templates
  {
    id: "taobao-modern-bold",
    platformId: "taobao",
    templateId: "modern-bold",
    name: "淘宝醒目促销",
    description: "突出促销信息的产品封面",
    adaptations: {
      fontSize: {
        title: 40,
        subtitle: 28,
      },
      layout: "center",
      spacing: {
        padding: 40,
        lineHeight: 1.3,
        titleSpacing: 12,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 12,
      },
    },
  },
  {
    id: "taobao-warm-pink",
    platformId: "taobao",
    templateId: "warm-pink",
    name: "淘宝温暖促销",
    description: "适合服装、美妆的温馨风格",
    adaptations: {
      fontSize: {
        title: 38,
        subtitle: 26,
      },
      layout: "center",
      spacing: {
        padding: 45,
        lineHeight: 1.4,
        titleSpacing: 14,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 12,
      },
    },
  },

  // 淘宝横版 templates
  {
    id: "taobao-banner-elegant-gold",
    platformId: "taobao-banner",
    templateId: "elegant-gold",
    name: "淘宝横版轻奢",
    description: "高端产品横版展示",
    adaptations: {
      fontSize: {
        title: 48,
        subtitle: 32,
      },
      layout: "center",
      spacing: {
        padding: 60,
        lineHeight: 1.4,
        titleSpacing: 18,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 8,
      },
    },
  },

  // 抖音 templates
  {
    id: "douyin-gradient-purple",
    platformId: "douyin",
    templateId: "gradient-purple",
    name: "抖音渐变紫韵",
    description: "时尚动感的短视频封面",
    adaptations: {
      fontSize: {
        title: 34,
        subtitle: 24,
      },
      layout: "bottom",
      spacing: {
        padding: 60,
        lineHeight: 1.4,
        titleSpacing: 15,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 20,
      },
    },
  },
  {
    id: "douyin-modern-bold",
    platformId: "douyin",
    templateId: "modern-bold",
    name: "抖音醒目冲击",
    description: "强烈的视觉冲击力",
    adaptations: {
      fontSize: {
        title: 36,
        subtitle: 26,
      },
      layout: "bottom",
      spacing: {
        padding: 50,
        lineHeight: 1.3,
        titleSpacing: 12,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 16,
      },
    },
  },

  // 微博 templates
  {
    id: "weibo-tech-blue",
    platformId: "weibo",
    templateId: "tech-blue",
    name: "微博科技蓝调",
    description: "适合科技资讯分享",
    adaptations: {
      fontSize: {
        title: 42,
        subtitle: 28,
      },
      layout: "center",
      spacing: {
        padding: 80,
        lineHeight: 1.4,
        titleSpacing: 20,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 12,
      },
    },
  },
  {
    id: "weibo-artistic-multi",
    platformId: "weibo",
    templateId: "artistic-multi",
    name: "微博艺术多彩",
    description: "创意内容的艺术风格",
    adaptations: {
      fontSize: {
        title: 46,
        subtitle: 30,
      },
      layout: "center",
      spacing: {
        padding: 70,
        lineHeight: 1.3,
        titleSpacing: 18,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 12,
      },
    },
  },

  // B站 templates
  {
    id: "bilibili-gradient-purple",
    platformId: "bilibili",
    templateId: "gradient-purple",
    name: "B站渐变紫韵",
    description: "符合B站审美的视频封面",
    adaptations: {
      fontSize: {
        title: 56,
        subtitle: 36,
      },
      layout: "bottom",
      spacing: {
        padding: 80,
        lineHeight: 1.3,
        titleSpacing: 20,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 16,
      },
    },
  },
  {
    id: "bilibili-modern-bold",
    platformId: "bilibili",
    templateId: "modern-bold",
    name: "B站醒目冲击",
    description: "吸引点击的视频封面",
    adaptations: {
      fontSize: {
        title: 60,
        subtitle: 38,
      },
      layout: "bottom",
      spacing: {
        padding: 70,
        lineHeight: 1.2,
        titleSpacing: 16,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 12,
      },
    },
  },

  // 知乎 templates
  {
    id: "zhihu-minimal-clean",
    platformId: "zhihu",
    templateId: "minimal-clean",
    name: "知乎简约清新",
    description: "适合知识分享的简洁风格",
    adaptations: {
      fontSize: {
        title: 40,
        subtitle: 28,
      },
      layout: "center",
      spacing: {
        padding: 80,
        lineHeight: 1.5,
        titleSpacing: 22,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 8,
      },
    },
  },
  {
    id: "zhihu-business-gray",
    platformId: "zhihu",
    templateId: "business-gray",
    name: "知乎商务灰度",
    description: "专业领域的深度内容",
    adaptations: {
      fontSize: {
        title: 44,
        subtitle: 30,
      },
      layout: "center",
      spacing: {
        padding: 70,
        lineHeight: 1.4,
        titleSpacing: 18,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 8,
      },
    },
  },
];

export function getPlatformTemplate(
  platformId: string,
  templateId: string
): PlatformTemplate | undefined {
  return PLATFORM_TEMPLATES.find(
    (pt) => pt.platformId === platformId && pt.templateId === templateId
  );
}

export function getPlatformTemplatesByPlatform(platformId: string): PlatformTemplate[] {
  return PLATFORM_TEMPLATES.filter((pt) => pt.platformId === platformId);
}

export function adaptTemplateForPlatform(
  platformId: string,
  templateId: string
): PlatformTemplate | undefined {
  const platformTemplate = getPlatformTemplate(platformId, templateId);
  if (platformTemplate) {
    return platformTemplate;
  }

  // If no specific adaptation exists, create a default one
  const template = STYLE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return undefined;

  return {
    id: `${platformId}-${templateId}-default`,
    platformId,
    templateId,
    name: `${template.name} - 默认`,
    description: template.description,
    adaptations: {
      fontSize: template.fontSize,
      layout: template.layout as "center" | "top" | "bottom" | "left" | "right",
      spacing: {
        padding: 60,
        lineHeight: 1.4,
        titleSpacing: 20,
      },
      elements: {
        showSubtitle: true,
        cornerRadius: 12,
      },
    },
  };
}