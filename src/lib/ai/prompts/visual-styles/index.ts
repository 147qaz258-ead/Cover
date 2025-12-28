/**
 * 视觉风格模板配置
 *
 * 新增风格步骤：
 * 1. 在 VISUAL_STYLE_TEMPLATES 数组添加配置项
 * 2. 添加预览图 public/visual-styles/{id}.png
 */

import { VisualStyleTemplate } from '@/types/visual-style';

// ==================== 风格模板配置 ====================

export const VISUAL_STYLE_TEMPLATES: VisualStyleTemplate[] = [
    // ==================== 写实风格 ====================
    {
        id: "realistic-product",
        name: "实物产品风",
        description: "真实质感的产品展示，适合电商、测评类内容",
        preview: "/visual-styles/realistic-product.png",
        category: "realistic",
        promptFragment: "realistic product photography style, professional studio lighting, clean gradient background, sharp focus on details, commercial photography aesthetic",
        isRecommended: true,
        sortOrder: 1,
    },
    {
        id: "realistic-food",
        name: "美食实拍风",
        description: "诱人的美食摄影，适合美食分享类内容",
        preview: "/visual-styles/realistic-food.png",
        category: "realistic",
        promptFragment: "professional food photography, appetizing presentation, warm lighting, shallow depth of field, culinary art aesthetic",
        sortOrder: 2,
    },

    // ==================== 插画风格 ====================
    {
        id: "illustration-flat",
        name: "扁平插画风",
        description: "现代简约的扁平设计，适合科技、教育类内容",
        preview: "/visual-styles/illustration-flat.png",
        category: "illustration",
        promptFragment: "modern flat illustration style, geometric shapes, clean lines, limited color palette, vector art aesthetic, 2D design",
        sortOrder: 10,
    },
    {
        id: "illustration-watercolor",
        name: "水彩手绘风",
        description: "柔和水彩质感，适合文艺、情感类内容",
        preview: "/visual-styles/illustration-watercolor.png",
        category: "illustration",
        promptFragment: "watercolor illustration style, soft brush strokes, pastel colors, artistic hand-painted texture, gentle gradients",
        sortOrder: 11,
    },

    // ==================== 动漫风格 ====================
    {
        id: "manga-anime",
        name: "日系动漫风",
        description: "日本动漫画风，适合二次元、ACG类内容",
        preview: "/visual-styles/manga-anime.png",
        category: "manga",
        promptFragment: "Japanese anime illustration style, vibrant colors, cel-shaded rendering, expressive design, dynamic composition, anime aesthetic",
        isRecommended: true,
        sortOrder: 20,
    },

    // ==================== 抽象风格 ====================
    {
        id: "abstract-gradient",
        name: "渐变几何风",
        description: "现代渐变与几何图形，适合科技、创意类内容",
        preview: "/visual-styles/abstract-gradient.png",
        category: "abstract",
        promptFragment: "modern gradient design, geometric abstract shapes, vibrant color transitions, contemporary digital art style",
        sortOrder: 30,
    },
];

// ==================== 查询函数 ====================

/**
 * 根据 ID 获取完整风格配置（含 promptFragment，仅后端使用）
 */
export function getVisualStyleTemplate(id: string): VisualStyleTemplate | undefined {
    return VISUAL_STYLE_TEMPLATES.find(t => t.id === id);
}

/**
 * 获取所有风格（用于 API 返回，移除 promptFragment）
 */
export function getVisualStyleTemplatesForAPI(): Omit<VisualStyleTemplate, 'promptFragment'>[] {
    return VISUAL_STYLE_TEMPLATES
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        .map(({ promptFragment, ...rest }) => rest);
}

/**
 * 按分类获取风格（用于 API 返回）
 */
export function getVisualStylesByCategory(
    category: VisualStyleTemplate["category"]
): Omit<VisualStyleTemplate, 'promptFragment'>[] {
    return VISUAL_STYLE_TEMPLATES
        .filter(t => t.category === category)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        .map(({ promptFragment, ...rest }) => rest);
}
