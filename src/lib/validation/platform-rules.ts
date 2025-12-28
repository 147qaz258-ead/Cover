import { Platform } from "@/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImageValidationOptions {
  checkFileSize?: boolean;
  checkDimensions?: boolean;
  checkFormat?: boolean;
  checkAspectRatio?: boolean;
}

export interface ContentValidationOptions {
  checkTitleLength?: boolean;
  checkTextLength?: boolean;
  checkKeywords?: boolean;
}

/**
 * Platform rule validator
 */
export class PlatformRuleValidator {
  constructor(private platform: Platform) { }

  /**
   * Validate image against platform rules
   */
  validateImage(
    imageFile: File | Buffer,
    metadata: { width: number; height: number; fileSize?: number; format?: string },
    options: ImageValidationOptions = {}
  ): ValidationResult {
    const {
      checkFileSize = true,
      checkDimensions = true,
      checkFormat = true,
      checkAspectRatio = true,
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (checkFileSize && metadata.fileSize) {
      if (metadata.fileSize > this.platform.maxFileSize) {
        const sizeMB = (metadata.fileSize / 1024 / 1024).toFixed(1);
        const maxSizeMB = (this.platform.maxFileSize / 1024 / 1024).toFixed(1);
        errors.push(
          `File size ${sizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB for ${this.platform.name}`
        );
      }
    }

    // Check dimensions
    if (checkDimensions) {
      const { width, height } = this.platform.dimensions;
      const tolerance = 10; // Allow 10px tolerance

      if (
        Math.abs(metadata.width - width) > tolerance ||
        Math.abs(metadata.height - height) > tolerance
      ) {
        errors.push(
          `Image dimensions ${metadata.width}x${metadata.height} do not match required dimensions ${width}x${height} for ${this.platform.name}`
        );
      }
    }

    // Check format
    if (checkFormat && metadata.format) {
      const normalizedFormat = metadata.format.toLowerCase().replace(".", "");
      if (!this.platform.supportedFormats.includes(normalizedFormat)) {
        errors.push(
          `Image format ${metadata.format} is not supported by ${this.platform.name}. Supported formats: ${this.platform.supportedFormats.join(
            ", "
          )}`
        );
      }
    }

    // Check aspect ratio
    if (checkAspectRatio) {
      const actualRatio = metadata.width / metadata.height;
      const [expectedWidth, expectedHeight] = this.platform.aspectRatio
        .split(":")
        .map(Number);
      const expectedRatio = expectedWidth / expectedHeight;
      const ratioDifference = Math.abs(actualRatio - expectedRatio);

      if (ratioDifference > 0.05) {
        // Allow 5% tolerance for aspect ratio
        warnings.push(
          `Aspect ratio ${actualRatio.toFixed(2)} is not optimal for ${this.platform.name} (expected: ${this.platform.aspectRatio})`
        );
      }
    }

    // Platform-specific warnings
    this.addPlatformSpecificWarnings(warnings, metadata);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate text content against platform rules
   */
  validateContent(
    title: string,
    content: string,
    options: ContentValidationOptions = {}
  ): ValidationResult {
    const {
      checkTitleLength = true,
      checkTextLength = true,
      checkKeywords = false,
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Title validation
    if (checkTitleLength) {
      const titleLimits = this.getTitleLimits();
      if (title.length < titleLimits.min) {
        errors.push(
          `Title is too short for ${this.platform.name}. Minimum: ${titleLimits.min} characters`
        );
      }
      if (title.length > titleLimits.max) {
        errors.push(
          `Title is too long for ${this.platform.name}. Maximum: ${titleLimits.max} characters`
        );
      }
    }

    // Content validation
    if (checkTextLength) {
      const contentLimits = this.getContentLimits();
      if (content.length > contentLimits.max) {
        warnings.push(
          `Content might be too long for ${this.platform.name}. Consider using ${contentLimits.max} characters or less`
        );
      }
    }

    // Keyword validation (for SEO/discoverability)
    if (checkKeywords) {
      const keywordValidation = this.validateKeywords(content);
      errors.push(...keywordValidation.errors);
      warnings.push(...keywordValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get title character limits for the platform
   */
  private getTitleLimits(): { min: number; max: number } {
    const limits: Record<string, { min: number; max: number }> = {
      "xiaohongshu": { min: 5, max: 50 },
      "xiaohongshu-vertical": { min: 5, max: 60 },
      "wechat": { min: 10, max: 80 },
      "wechat-banner": { min: 5, max: 40 },
      "taobao": { min: 5, max: 30 },
      "taobao-banner": { min: 5, max: 25 },
      "douyin": { min: 5, max: 55 },
      "weibo": { min: 5, max: 60 },
      "bilibili": { min: 5, max: 80 },
      "zhihu": { min: 10, max: 70 },
    };

    return limits[this.platform.id] || { min: 5, max: 50 };
  }

  /**
   * Get content character limits for the platform
   */
  private getContentLimits(): { max: number } {
    const limits: Record<string, { max: number }> = {
      "xiaohongshu": { max: 1000 },
      "xiaohongshu-vertical": { max: 1500 },
      "wechat": { max: 2000 },
      "wechat-banner": { max: 100 },
      "taobao": { max: 500 },
      "taobao-banner": { max: 200 },
      "douyin": { max: 2000 },
      "weibo": { max: 140 },
      "bilibili": { max: 2000 },
      "zhihu": { max: 3000 },
    };

    return limits[this.platform.id] || { max: 1000 };
  }

  /**
   * Validate keywords in content
   */
  private validateKeywords(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Platform-specific keyword rules
    switch (this.platform.id) {
      case "taobao":
      case "taobao-banner":
        // E-commerce platforms should avoid certain restricted words
        const restrictedWords = ["最", "第一", "顶级", "极限", "绝对"];
        const foundWords = restrictedWords.filter((word) => content.includes(word));
        if (foundWords.length > 0) {
          warnings.push(
            `Avoid using absolute terms like: ${foundWords.join(", ")} for ${this.platform.name}`
          );
        }
        break;

      case "xiaohongshu":
        // Xiaohongshu prefers emoji usage
        if (!/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content)) {
          warnings.push(
            `Consider adding emojis to improve engagement on ${this.platform.name}`
          );
        }
        break;

      case "douyin":
        // Douyin prefers hashtags
        if (!content.includes("#")) {
          warnings.push(
            `Consider adding hashtags (#) to improve discoverability on ${this.platform.name}`
          );
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Add platform-specific warnings
   */
  private addPlatformSpecificWarnings(
    warnings: string[],
    metadata: { width: number; height: number; fileSize?: number; format?: string }
  ): void {
    switch (this.platform.id) {
      case "taobao":
      case "taobao-banner":
        // Warn about file size for e-commerce
        if (metadata.fileSize && metadata.fileSize > 2 * 1024 * 1024) {
          // 2MB
          warnings.push(
            "Large file sizes may impact loading speed on e-commerce platforms"
          );
        }
        break;

      case "douyin":
      case "xiaohongshu":
        // Mobile-first platforms
        if (metadata.width < 720 || metadata.height < 720) {
          warnings.push(
            "Lower resolution images may appear blurry on mobile devices"
          );
        }
        break;

      case "wechat":
        // WeChat specific considerations
        if (metadata.format === "png" && (metadata.fileSize || 0) > 1024 * 1024) {
          // 1MB
          warnings.push("Consider using JPG format for better compression on WeChat");
        }
        break;
    }
  }
}

/**
 * Factory function to create validator for platform
 */
export function createPlatformValidator(platform: Platform): PlatformRuleValidator {
  return new PlatformRuleValidator(platform);
}

/**
 * Validate multiple platforms
 */
export function validateMultiplePlatforms(
  platforms: Platform[],
  imageMetadata: { width: number; height: number; fileSize?: number; format?: string },
  options: ImageValidationOptions = {}
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const platform of platforms) {
    const validator = new PlatformRuleValidator(platform);
    // validateImage 的第一个参数预期是 File | Buffer，但这里只做 metadata 验证
    // 传递 null as any 作为占位符，因为只使用 metadata 参数
    results[platform.id] = validator.validateImage(null as any, imageMetadata, options);
  }

  return results;
}

/**
 * Get optimal image dimensions for multiple platforms
 */
export function getOptimalDimensions(platformIds: string[]): {
  width: number;
  height: number;
  supportedPlatforms: string[];
} {
  // Find common dimensions that work for most platforms
  const commonDimensions: Record<string, { count: number; dimensions: { width: number; height: number } }> = {
    "1:1": { count: 0, dimensions: { width: 1080, height: 1080 } },
    "16:9": { count: 0, dimensions: { width: 1920, height: 1080 } },
    "9:16": { count: 0, dimensions: { width: 1080, height: 1920 } },
  };

  // Count how many platforms support each aspect ratio
  for (const platformId of platformIds) {
    // This would need access to platform specs - simplified for now
    if (["xiaohongshu", "taobao"].includes(platformId)) {
      commonDimensions["1:1"].count++;
    } else if (["wechat", "weibo", "bilibili", "zhihu"].includes(platformId)) {
      commonDimensions["16:9"].count++;
    } else if (["douyin", "xiaohongshu-vertical"].includes(platformId)) {
      commonDimensions["9:16"].count++;
    }
  }

  // Find the most common aspect ratio
  const bestRatio = Object.entries(commonDimensions).reduce((a, b) =>
    a[1].count > b[1].count ? a : b
  );

  return {
    ...bestRatio[1].dimensions,
    supportedPlatforms: platformIds,
  };
}