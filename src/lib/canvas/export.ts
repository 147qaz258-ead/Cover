import { Canvas } from "fabric";
import { Platform } from "@/types";

export interface ExportOptions {
  format?: "png" | "jpg" | "webp" | "svg";
  quality?: number; // 0-1 for lossy formats
  multiplier?: number; // For higher resolution exports
  cropToContent?: boolean;
  backgroundColor?: string;
  removeBackground?: boolean;
  optimize?: boolean;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    keywords?: string[];
  };
}

export interface ExportResult {
  dataUrl: string;
  blob?: Blob;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  metadata?: any;
}

/**
 * Canvas export manager
 */
export class CanvasExporter {
  private canvas: Canvas;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Export canvas to various formats
   */
  async export(options: ExportOptions = {}): Promise<ExportResult> {
    const {
      format = "png",
      quality = 0.9,
      multiplier = 2,
      cropToContent = false,
      backgroundColor,
      removeBackground = false,
      optimize = true,
      metadata,
    } = options;

    // Prepare canvas for export
    const originalBg = this.canvas.backgroundColor;
    const originalObjects = [...this.canvas.getObjects()];

    try {
      // Handle background
      if (backgroundColor !== undefined) {
        this.canvas.backgroundColor = backgroundColor;
        this.canvas.renderAll();
      } else if (removeBackground) {
        this.canvas.backgroundColor = "transparent";
        this.canvas.renderAll();
      }

      // Crop to content if requested
      if (cropToContent) {
        await this.cropToContent();
      }

      // Export based on format
      let result: ExportResult;

      switch (format) {
        case "png":
          result = await this.exportPNG({ quality, multiplier, optimize });
          break;
        case "jpg":
          result = await this.exportJPG({ quality, multiplier, optimize });
          break;
        case "webp":
          result = await this.exportWebP({ quality, multiplier, optimize });
          break;
        case "svg":
          result = await this.exportSVG({ optimize });
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Add metadata if provided
      if (metadata) {
        result.metadata = metadata;
      }

      return result;
    } finally {
      // Restore original state
      this.canvas.backgroundColor = originalBg;
      this.canvas.renderAll();
      // Don't need to restore objects as we didn't modify them
    }
  }

  /**
   * Export to PNG format
   */
  private async exportPNG(options: {
    quality?: number;
    multiplier?: number;
    optimize?: boolean;
  }): Promise<ExportResult> {
    const { quality = 1, multiplier = 2, optimize = true } = options;

    const dataURL = this.canvas.toDataURL({
      format: "png",
      quality,
      multiplier,
      enableRetinaScaling: true,
    });

    const blob = await this.dataURLToBlob(dataURL, "image/png");
    const fileSize = blob.size;

    return {
      dataUrl: dataURL,
      blob,
      fileSize,
      dimensions: {
        width: this.canvas.width! * multiplier,
        height: this.canvas.height! * multiplier,
      },
      format: "png",
    };
  }

  /**
   * Export to JPG format
   */
  private async exportJPG(options: {
    quality?: number;
    multiplier?: number;
    optimize?: boolean;
  }): Promise<ExportResult> {
    const { quality = 0.9, multiplier = 2 } = options;

    // JPG needs a background
    if (!this.canvas.backgroundColor || this.canvas.backgroundColor === "transparent") {
      this.canvas.backgroundColor = "#FFFFFF";
      this.canvas.renderAll();
    }

    const dataURL = this.canvas.toDataURL({
      format: "jpeg",
      quality,
      multiplier,
      enableRetinaScaling: true,
    });

    const blob = await this.dataURLToBlob(dataURL, "image/jpeg");
    const fileSize = blob.size;

    return {
      dataUrl: dataURL,
      blob,
      fileSize,
      dimensions: {
        width: this.canvas.width! * multiplier,
        height: this.canvas.height! * multiplier,
      },
      format: "jpg",
    };
  }

  /**
   * Export to WebP format
   */
  private async exportWebP(options: {
    quality?: number;
    multiplier?: number;
    optimize?: boolean;
  }): Promise<ExportResult> {
    const { quality = 0.9, multiplier = 2 } = options;

    const dataURL = this.canvas.toDataURL({
      format: "webp",
      quality,
      multiplier,
      enableRetinaScaling: true,
    });

    const blob = await this.dataURLToBlob(dataURL, "image/webp");
    const fileSize = blob.size;

    return {
      dataUrl: dataURL,
      blob,
      fileSize,
      dimensions: {
        width: this.canvas.width! * multiplier,
        height: this.canvas.height! * multiplier,
      },
      format: "webp",
    };
  }

  /**
   * Export to SVG format
   */
  private async exportSVG(options: { optimize?: boolean }): Promise<ExportResult> {
    const { optimize = true } = options;

    const svg = this.canvas.toSVG({
      width: String(this.canvas.width),
      height: String(this.canvas.height),
      viewBox: {
        x: 0,
        y: 0,
        width: this.canvas.width ?? 0,
        height: this.canvas.height ?? 0,
      },
    });

    let optimizedSvg = svg;
    if (optimize) {
      optimizedSvg = this.optimizeSVG(svg);
    }

    const blob = new Blob([optimizedSvg], { type: "image/svg+xml" });
    const dataURL = `data:image/svg+xml;base64,${btoa(optimizedSvg)}`;
    const fileSize = blob.size;

    return {
      dataUrl: dataURL,
      blob,
      fileSize,
      dimensions: {
        width: this.canvas.width!,
        height: this.canvas.height!,
      },
      format: "svg",
    };
  }

  /**
   * Export for specific platform with platform-specific optimizations
   */
  async exportForPlatform(
    platform: Platform,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const platformOptions: ExportOptions = {
      format: "jpg",
      quality: 0.85,
      multiplier: 2,
      ...options,
    };

    // Platform-specific optimizations
    switch (platform.id) {
      case "xiaohongshu":
      case "douyin":
        // These platforms prefer WebP for better compression
        platformOptions.format = "webp";
        platformOptions.quality = 0.9;
        break;

      case "wechat":
      case "taobao":
        // These platforms work well with JPG
        platformOptions.format = "jpg";
        platformOptions.quality = 0.8;
        break;

      case "bilibili":
      case "zhihu":
        // These platforms accept high-quality PNG
        platformOptions.format = "png";
        platformOptions.quality = 1;
        break;
    }

    return this.export(platformOptions);
  }

  /**
   * Export multiple resolutions for responsive use
   */
  async exportMultipleResolutions(
    resolutions: number[],
    options: ExportOptions = {}
  ): Promise<{ resolution: number; result: ExportResult }[]> {
    const results = [];

    for (const resolution of resolutions) {
      const result = await this.export({
        ...options,
        multiplier: resolution / this.canvas.width!,
      });
      results.push({
        resolution,
        result,
      });
    }

    return results;
  }

  /**
   * Crop canvas to content bounds
   */
  private async cropToContent(): Promise<void> {
    // Calculate content bounds from objects
    const objects = this.canvas.getObjects();
    if (objects.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach(obj => {
      const rect = obj.getBoundingRect();
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.left + rect.width);
      maxY = Math.max(maxY, rect.top + rect.height);
    });

    const bounds = {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // Add some padding
    const padding = 20;
    bounds.left = Math.max(0, bounds.left - padding);
    bounds.top = Math.max(0, bounds.top - padding);
    bounds.width = Math.min(
      this.canvas.width! - bounds.left,
      bounds.width + padding * 2
    );
    bounds.height = Math.min(
      this.canvas.height! - bounds.top,
      bounds.height + padding * 2
    );

    // Create a temporary canvas
    const tempCanvas = new Canvas(undefined, {
      width: bounds.width,
      height: bounds.height,
    });

    // Clone and move objects
    for (const obj of objects) {
      const cloned = await obj.clone();
      cloned.set({
        left: (cloned.left || 0) - bounds.left,
        top: (cloned.top || 0) - bounds.top,
      });
      tempCanvas.add(cloned);
    }

    // Replace original canvas content
    this.canvas.clear();
    this.canvas.setWidth(bounds.width);
    this.canvas.setHeight(bounds.height);

    tempCanvas.getObjects().forEach((obj) => {
      this.canvas.add(obj);
    });

    this.canvas.renderAll();
  }

  /**
   * Convert data URL to Blob
   */
  private async dataURLToBlob(dataURL: string, mimeType: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Split the data URL
        const parts = dataURL.split(",");
        const byteString = atob(parts[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }

        resolve(new Blob([uint8Array], { type: mimeType }));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Optimize SVG output
   */
  private optimizeSVG(svg: string): string {
    // Remove unnecessary whitespace and comments
    return svg
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate preview thumbnail
   */
  async generateThumbnail(
    size: { width: number; height: number } = { width: 300, height: 200 }
  ): Promise<string> {
    const aspectRatio = this.canvas.width! / this.canvas.height!;
    let thumbnailWidth = size.width;
    let thumbnailHeight = size.height;

    if (aspectRatio > size.width / size.height) {
      thumbnailHeight = thumbnailWidth / aspectRatio;
    } else {
      thumbnailWidth = thumbnailHeight * aspectRatio;
    }

    const dataURL = this.canvas.toDataURL({
      format: "png",
      quality: 0.8,
      multiplier: thumbnailWidth / this.canvas.width!,
      enableRetinaScaling: false,
    });

    return dataURL;
  }

  /**
   * Create download link
   */
  createDownloadLink(
    result: ExportResult,
    filename?: string
  ): HTMLAnchorElement {
    const link = document.createElement("a");
    link.href = result.dataUrl;
    link.download = filename || `export.${result.format}`;
    return link;
  }

  /**
   * Trigger download
   */
  download(result: ExportResult, filename?: string): void {
    const link = this.createDownloadLink(result, filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Factory function to create canvas exporter
 */
export function createCanvasExporter(canvas: Canvas): CanvasExporter {
  return new CanvasExporter(canvas);
}

/**
 * Utility function to estimate file size before export
 */
export function estimateFileSize(
  canvas: Canvas,
  format: string,
  quality: number = 0.9,
  multiplier: number = 1
): number {
  const width = canvas.width! * multiplier;
  const height = canvas.height! * multiplier;
  const pixels = width * height;

  // Rough estimation based on format
  let bytesPerPixel: number;
  switch (format) {
    case "png":
      bytesPerPixel = 4; // RGBA
      break;
    case "jpg":
      bytesPerPixel = 3 * quality; // RGB with compression
      break;
    case "webp":
      bytesPerPixel = 3 * quality * 0.8; // WebP is generally more efficient
      break;
    default:
      bytesPerPixel = 4;
  }

  return Math.round(pixels * bytesPerPixel);
}

/**
 * Utility function to determine optimal export format
 */
export function getOptimalFormat(
  hasTransparency: boolean,
  fileSizeLimit?: number
): "png" | "jpg" | "webp" {
  if (hasTransparency) {
    return "png";
  }

  if (fileSizeLimit && fileSizeLimit < 100000) { // 100KB
    return "webp";
  }

  if (fileSizeLimit && fileSizeLimit < 500000) { // 500KB
    return "jpg";
  }

  return "webp"; // Default to WebP for best quality/size ratio
}