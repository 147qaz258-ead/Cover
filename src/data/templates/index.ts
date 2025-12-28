import { StyleTemplate } from "@/types";

export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: "minimal-clean",
    name: "简约清新",
    description: "极简设计，突出内容本身",
    preview: "/templates/minimal-clean.jpg",
    backgroundColor: "#FFFFFF",
    textColor: "#333333",
    accentColor: "#4A90E2",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 48,
      subtitle: 32,
    },
    layout: "center",
  },
  {
    id: "modern-bold",
    name: "现代醒目",
    description: "大胆对比，强烈的视觉冲击",
    preview: "/templates/modern-bold.jpg",
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    accentColor: "#FF6B6B",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 56,
      subtitle: 36,
    },
    layout: "center",
  },
  {
    id: "elegant-gold",
    name: "轻奢金典",
    description: "高级质感，优雅奢华",
    preview: "/templates/elegant-gold.jpg",
    backgroundColor: "#2C3E50",
    textColor: "#ECF0F1",
    accentColor: "#F1C40F",
    fontFamily: "PingFang SC, Microsoft YaHei, serif",
    fontSize: {
      title: 52,
      subtitle: 34,
    },
    layout: "center",
  },
  {
    id: "nature-fresh",
    name: "自然清新",
    description: "绿色环保，自然舒适",
    preview: "/templates/nature-fresh.jpg",
    backgroundColor: "#E8F5E9",
    textColor: "#2E7D32",
    accentColor: "#81C784",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 46,
      subtitle: 30,
    },
    layout: "center",
  },
  {
    id: "tech-blue",
    name: "科技蓝调",
    description: "科技感十足，专业可信",
    preview: "/templates/tech-blue.jpg",
    backgroundColor: "#0F2027",
    textColor: "#FFFFFF",
    accentColor: "#4FC3F7",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 50,
      subtitle: 32,
    },
    layout: "center",
  },
  {
    id: "warm-pink",
    name: "温暖粉调",
    description: "温馨甜美，亲和力强",
    preview: "/templates/warm-pink.jpg",
    backgroundColor: "#FFF0F5",
    textColor: "#D81B60",
    accentColor: "#FF4081",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 44,
      subtitle: 28,
    },
    layout: "center",
  },
  {
    id: "vintage-brown",
    name: "复古棕调",
    description: "复古怀旧，经典永存",
    preview: "/templates/vintage-brown.jpg",
    backgroundColor: "#3E2723",
    textColor: "#D7CCC8",
    accentColor: "#A1887F",
    fontFamily: "PingFang SC, Microsoft YaHei, serif",
    fontSize: {
      title: 48,
      subtitle: 32,
    },
    layout: "center",
  },
  {
    id: "gradient-purple",
    name: "渐变紫韵",
    description: "梦幻渐变，时尚前沿",
    preview: "/templates/gradient-purple.jpg",
    backgroundColor: "#6A1B9A",
    textColor: "#FFFFFF",
    accentColor: "#CE93D8",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 54,
      subtitle: 35,
    },
    layout: "center",
  },
  {
    id: "business-gray",
    name: "商务灰度",
    description: "商务专业，稳重大气",
    preview: "/templates/business-gray.jpg",
    backgroundColor: "#37474F",
    textColor: "#ECEFF1",
    accentColor: "#78909C",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 50,
      subtitle: 32,
    },
    layout: "center",
  },
  {
    id: "artistic-multi",
    name: "艺术多彩",
    description: "色彩斑斓，创意无限",
    preview: "/templates/artistic-multi.jpg",
    backgroundColor: "#FFFFFF",
    textColor: "#212121",
    accentColor: "#FF5722",
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: {
      title: 56,
      subtitle: 36,
    },
    layout: "center",
  },
];

export function getStyleTemplate(id: string): StyleTemplate | undefined {
  return STYLE_TEMPLATES.find(template => template.id === id);
}

export function getTemplates(): StyleTemplate[] {
  return STYLE_TEMPLATES;
}

export function getStyleTemplatesByCategory(category: "minimal" | "bold" | "elegant" | "nature"): StyleTemplate[] {
  switch (category) {
    case "minimal":
      return STYLE_TEMPLATES.filter(t => ["minimal-clean", "tech-blue", "business-gray"].includes(t.id));
    case "bold":
      return STYLE_TEMPLATES.filter(t => ["modern-bold", "gradient-purple", "artistic-multi"].includes(t.id));
    case "elegant":
      return STYLE_TEMPLATES.filter(t => ["elegant-gold", "warm-pink", "vintage-brown"].includes(t.id));
    case "nature":
      return STYLE_TEMPLATES.filter(t => ["nature-fresh"].includes(t.id));
    default:
      return STYLE_TEMPLATES;
  }
}