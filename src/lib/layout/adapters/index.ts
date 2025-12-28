import { Platform, StyleTemplate, CoverCustomizations } from "@/types";
import { adaptTemplateForPlatform } from "@/data/templates/platform-templates";

export interface LayoutConfig {
  dimensions: {
    width: number;
    height: number;
  };
  textLayout: {
    title: {
      x: number;
      y: number;
      width: number;
      fontSize: number;
      lineHeight: number;
      align: "left" | "center" | "right";
    };
    subtitle?: {
      x: number;
      y: number;
      width: number;
      fontSize: number;
      lineHeight: number;
      align: "left" | "center" | "right";
    };
  };
  elements: {
    padding: number;
    cornerRadius: number;
    borderWidth?: number;
  };
  imageProcessing: {
    quality: number;
    format: "jpg" | "png" | "webp";
    optimizeForWeb: boolean;
  };
}

/**
 * Platform-specific layout adapter
 */
export class PlatformLayoutAdapter {
  constructor(private platform: Platform) { }

  /**
   * Adapt layout configuration for the platform
   */
  adaptLayout(template: StyleTemplate, customizations?: CoverCustomizations): LayoutConfig {
    const platformTemplate = adaptTemplateForPlatform(this.platform.id, template.id);
    const adaptations = platformTemplate?.adaptations;

    return {
      dimensions: this.platform.dimensions,
      textLayout: this.calculateTextLayout(adaptations || {}, customizations),
      elements: this.calculateElements(adaptations || {}, customizations),
      imageProcessing: this.calculateImageProcessing(),
    };
  }

  /**
   * Calculate text layout based on platform adaptations
   */
  private calculateTextLayout(
    adaptations: any,
    customizations?: CoverCustomizations
  ): LayoutConfig["textLayout"] {
    const { width, height } = this.platform.dimensions;
    const padding = adaptations.spacing?.padding || 60;
    const layout = adaptations.layout || "center";
    const fontSize = adaptations.fontSize || customizations?.fontSize || { title: 48, subtitle: 32 };
    const lineHeight = adaptations.spacing?.lineHeight || 1.4;
    const titleSpacing = adaptations.spacing?.titleSpacing || 20;

    const layoutConfig: LayoutConfig["textLayout"] = {
      title: this.calculateTitlePosition(
        width,
        height,
        padding,
        layout,
        fontSize.title,
        lineHeight
      ),
    };

    // Add subtitle if enabled
    if (adaptations.elements?.showSubtitle !== false) {
      layoutConfig.subtitle = this.calculateSubtitlePosition(
        width,
        height,
        padding,
        layout,
        fontSize.subtitle || 32,
        lineHeight,
        layoutConfig.title.y,
        fontSize.title,
        titleSpacing
      );
    }

    return layoutConfig;
  }

  /**
   * Calculate title position based on layout
   */
  private calculateTitlePosition(
    canvasWidth: number,
    canvasHeight: number,
    padding: number,
    layout: string,
    fontSize: number,
    lineHeight: number
  ): LayoutConfig["textLayout"]["title"] {
    const availableWidth = canvasWidth - (padding * 2);
    const maxTitleWidth = availableWidth * 0.9; // Use 90% of available width for safety

    switch (layout) {
      case "center":
        return {
          x: canvasWidth / 2,
          y: canvasHeight / 2,
          width: maxTitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };

      case "top":
        return {
          x: canvasWidth / 2,
          y: padding + fontSize,
          width: maxTitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };

      case "bottom":
        return {
          x: canvasWidth / 2,
          y: canvasHeight - padding - fontSize,
          width: maxTitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };

      case "left":
        return {
          x: padding,
          y: canvasHeight / 2,
          width: maxTitleWidth,
          fontSize,
          lineHeight,
          align: "left",
        };

      case "right":
        return {
          x: canvasWidth - padding,
          y: canvasHeight / 2,
          width: maxTitleWidth,
          fontSize,
          lineHeight,
          align: "right",
        };

      default:
        return {
          x: canvasWidth / 2,
          y: canvasHeight / 2,
          width: maxTitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };
    }
  }

  /**
   * Calculate subtitle position
   */
  private calculateSubtitlePosition(
    canvasWidth: number,
    canvasHeight: number,
    padding: number,
    layout: string,
    fontSize: number,
    lineHeight: number,
    titleY: number,
    titleFontSize: number,
    titleSpacing: number
  ): LayoutConfig["textLayout"]["subtitle"] {
    const availableWidth = canvasWidth - (padding * 2);
    const maxSubtitleWidth = availableWidth * 0.9;
    const verticalOffset = titleFontSize + titleSpacing;

    switch (layout) {
      case "center":
        return {
          x: canvasWidth / 2,
          y: titleY + verticalOffset,
          width: maxSubtitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };

      case "top":
        return {
          x: canvasWidth / 2,
          y: padding + titleFontSize + verticalOffset,
          width: maxSubtitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };

      case "bottom":
        return {
          x: canvasWidth / 2,
          y: canvasHeight - padding - fontSize - verticalOffset,
          width: maxSubtitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };

      case "left":
        return {
          x: padding,
          y: titleY + verticalOffset,
          width: maxSubtitleWidth,
          fontSize,
          lineHeight,
          align: "left",
        };

      case "right":
        return {
          x: canvasWidth - padding,
          y: titleY + verticalOffset,
          width: maxSubtitleWidth,
          fontSize,
          lineHeight,
          align: "right",
        };

      default:
        return {
          x: canvasWidth / 2,
          y: titleY + verticalOffset,
          width: maxSubtitleWidth,
          fontSize,
          lineHeight,
          align: "center",
        };
    }
  }

  /**
   * Calculate visual elements
   */
  private calculateElements(
    adaptations: any,
    customizations?: CoverCustomizations
  ): LayoutConfig["elements"] {
    return {
      padding: adaptations.spacing?.padding || 60,
      cornerRadius: adaptations.elements?.cornerRadius || customizations?.borderRadius || 12,
      borderWidth: adaptations.elements?.borderWidth,
    };
  }

  /**
   * Calculate image processing settings
   */
  private calculateImageProcessing(): LayoutConfig["imageProcessing"] {
    // Platform-specific image optimization
    switch (this.platform.id) {
      case "taobao":
      case "taobao-banner":
        return {
          quality: 85,
          format: "jpg",
          optimizeForWeb: true,
        };

      case "xiaohongshu":
      case "douyin":
        return {
          quality: 90,
          format: "webp",
          optimizeForWeb: true,
        };

      case "wechat":
      case "bilibili":
        return {
          quality: 95,
          format: "jpg",
          optimizeForWeb: true,
        };

      default:
        return {
          quality: 90,
          format: "jpg",
          optimizeForWeb: true,
        };
    }
  }
}

/**
 * Factory function to create layout adapter for platform
 */
export function createLayoutAdapter(platform: Platform): PlatformLayoutAdapter {
  return new PlatformLayoutAdapter(platform);
}

/**
 * Predefined layout presets for common use cases
 */
export const LAYOUT_PRESETS = {
  // Social media presets
  SOCIAL_MEDIA_CENTER: {
    layout: "center",
    spacing: { padding: 60, lineHeight: 1.4, titleSpacing: 20 },
    elements: { showSubtitle: true, cornerRadius: 16 },
  },

  SOCIAL_MEDIA_BOTTOM: {
    layout: "bottom",
    spacing: { padding: 50, lineHeight: 1.3, titleSpacing: 15 },
    elements: { showSubtitle: true, cornerRadius: 12 },
  },

  // E-commerce presets
  ECOMMERCE_BOLD: {
    layout: "center",
    spacing: { padding: 40, lineHeight: 1.3, titleSpacing: 12 },
    elements: { showSubtitle: true, cornerRadius: 8 },
  },

  // Content platform presets
  CONTENT_PROFESSIONAL: {
    layout: "center",
    spacing: { padding: 80, lineHeight: 1.5, titleSpacing: 25 },
    elements: { showSubtitle: true, cornerRadius: 8, borderWidth: 2 },
  },
} as const;

/**
 * Get layout preset by name
 */
export function getLayoutPreset(name: keyof typeof LAYOUT_PRESETS) {
  return LAYOUT_PRESETS[name];
}