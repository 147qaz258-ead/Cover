/**
 * 视觉风格模板类型定义
 * 用于定义不同的图像生成风格，如实物产品风、扁平插画风、日系动漫风等
 */

// ==================== 核心类型 ====================

/**
 * 视觉风格模板
 */
export interface VisualStyleTemplate {
    /** 唯一标识符，如 "realistic-product" */
    id: string;

    /** 显示名称，如 "实物产品风" */
    name: string;

    /** 简短描述 */
    description: string;

    /** 预览图路径 */
    preview: string;

    /** 分类 */
    category: VisualStyleCategory;

    /** 核心：风格提示词片段，用于替换 [STYLE_PLACEHOLDER] */
    promptFragment: string;

    /** 是否推荐 */
    isRecommended?: boolean;

    /** 排序权重 */
    sortOrder?: number;
}

/**
 * 风格分类
 */
export type VisualStyleCategory = "realistic" | "illustration" | "manga" | "abstract";

// ==================== 常量 ====================

/**
 * 风格分类名称映射
 */
export const STYLE_CATEGORY_NAMES: Record<VisualStyleCategory, string> = {
    realistic: "写实风格",
    illustration: "插画风格",
    manga: "动漫风格",
    abstract: "抽象风格",
};
