export interface ImageOptimizationOptions {
  // Output format
  format?: "webp" | "jpeg" | "png" | "avif";

  // Quality settings
  quality?: number; // 0-100

  // Resize options
  width?: number;
  height?: number;
  fit?: "contain" | "cover" | "fill" | "inside" | "outside";

  // Compression settings
  compressionLevel?: number; // 0-9

  // Metadata stripping
  stripMetadata?: boolean;

  // Progressive loading
  progressive?: boolean;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number; // bytes
  originalSize: number;
  compressionRatio: number;
  webpUrl?: string;
}

export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  hasTransparency: boolean;
  colorSpace: string;
  density?: number;
}

/**
 * Service for optimizing images with WebP conversion and compression
 */
export class ImageOptimizer {
  private defaultOptions: ImageOptimizationOptions = {
    format: "webp",
    quality: 80,
    compressionLevel: 6,
    stripMetadata: true,
    progressive: true,
  };

  constructor(private options: Partial<ImageOptimizationOptions> = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Optimize an image buffer
   */
  async optimizeImage(
    imageBuffer: Buffer,
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<OptimizedImageResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const originalSize = imageBuffer.length;

    try {
      // Get image metadata
      const metadata = await this.getImageMetadata(imageBuffer);

      // Determine best format based on image characteristics
      const format = mergedOptions.format || this.selectOptimalFormat(metadata);

      // Apply optimization
      let optimizedBuffer: Buffer;
      let width = metadata.width;
      let height = metadata.height;

      switch (format) {
        case "webp":
          optimizedBuffer = await this.convertToWebP(imageBuffer, mergedOptions);
          break;

        case "avif":
          optimizedBuffer = await this.convertToAVIF(imageBuffer, mergedOptions);
          break;

        case "jpeg":
          optimizedBuffer = await this.convertToJPEG(imageBuffer, mergedOptions);
          break;

        case "png":
          optimizedBuffer = await this.convertToPNG(imageBuffer, mergedOptions);
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Get final dimensions after optimization
      const finalMetadata = await this.getImageMetadata(optimizedBuffer);
      width = finalMetadata.width;
      height = finalMetadata.height;

      const compressionRatio = (originalSize - optimizedBuffer.length) / originalSize;

      return {
        buffer: optimizedBuffer,
        format,
        width,
        height,
        size: optimizedBuffer.length,
        originalSize,
        compressionRatio,
      };
    } catch (error) {
      console.error("Image optimization failed:", error);
      // Return original buffer if optimization fails
      return {
        buffer: imageBuffer,
        format: "original",
        width: 0,
        height: 0,
        size: originalSize,
        originalSize,
        compressionRatio: 0,
      };
    }
  }

  /**
   * Get metadata from image buffer
   */
  async getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
    // In a real implementation, you'd use a library like 'sharp' or 'jimp'
    // For now, we'll provide a basic implementation
    try {
      // Detect format from magic bytes
      const format = this.detectImageFormat(buffer);

      // Extract basic dimensions (simplified)
      let width = 0;
      let height = 0;

      if (format === "png") {
        // PNG dimensions are at offset 16-24
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      } else if (format === "jpeg") {
        // JPEG parsing is more complex - simplified here
        // In production, use a proper image processing library
        width = 1024; // Placeholder
        height = 1024; // Placeholder
      } else if (format === "webp") {
        // WebP dimensions are at specific offsets
        if (buffer[15] === 0x2C) { // Extended WebP
          width = buffer[26] | (buffer[27] << 8) | (buffer[28] << 16);
          height = buffer[29] | (buffer[30] << 8) | (buffer[31] << 16);
        }
      }

      return {
        format,
        width,
        height,
        hasAlpha: format === "png" || format === "webp",
        hasTransparency: format === "png" || format === "webp",
        colorSpace: "srgb", // Default assumption
        density: 72, // Default DPI
      };
    } catch (error) {
      throw new Error(`Failed to extract image metadata: ${error}`);
    }
  }

  /**
   * Convert image to WebP format
   */
  private async convertToWebP(
    buffer: Buffer,
    options: ImageOptimizationOptions
  ): Promise<Buffer> {
    // In production, use 'sharp' library:
    // return await sharp(buffer)
    //   .webp({ quality: options.quality })
    //   .resize(options.width, options.height, { fit: options.fit })
    //   .toBuffer();

    // Simplified implementation for demonstration
    console.log(`Converting to WebP with quality ${options.quality}`);

    // This would be replaced with actual image processing
    // For now, just return the original buffer
    return buffer;
  }

  /**
   * Convert image to AVIF format
   */
  private async convertToAVIF(
    buffer: Buffer,
    options: ImageOptimizationOptions
  ): Promise<Buffer> {
    // AVIF provides better compression than WebP but less browser support
    console.log(`Converting to AVIF with quality ${options.quality}`);

    // In production:
    // return await sharp(buffer)
    //   .avif({ quality: options.quality })
    //   .resize(options.width, options.height, { fit: options.fit })
    //   .toBuffer();

    return buffer;
  }

  /**
   * Convert image to JPEG format
   */
  private async convertToJPEG(
    buffer: Buffer,
    options: ImageOptimizationOptions
  ): Promise<Buffer> {
    console.log(`Converting to JPEG with quality ${options.quality}`);

    // In production:
    // return await sharp(buffer)
    //   .jpeg({ quality: options.quality, progressive: options.progressive })
    //   .resize(options.width, options.height, { fit: options.fit })
    //   .toBuffer();

    return buffer;
  }

  /**
   * Convert image to PNG format
   */
  private async convertToPNG(
    buffer: Buffer,
    options: ImageOptimizationOptions
  ): Promise<Buffer> {
    console.log(`Converting to PNG with compression level ${options.compressionLevel}`);

    // In production:
    // return await sharp(buffer)
    //   .png({ compressionLevel: options.compressionLevel, progressive: options.progressive })
    //   .resize(options.width, options.height, { fit: options.fit })
    //   .toBuffer();

    return buffer;
  }

  /**
   * Detect image format from buffer magic bytes
   */
  private detectImageFormat(buffer: Buffer): string {
    const signature = buffer.subarray(0, 12);

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E) {
      return "png";
    }

    // JPEG signature: FF D8 FF
    if (signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF) {
      return "jpeg";
    }

    // WebP signature: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
    if (signature[0] === 0x52 && signature[1] === 0x49 && signature[2] === 0x46) {
      return "webp";
    }

    // AVIF signature: 00 00 00 20 66 74 79 70 61 76 69 66
    if (signature[8] === 0x61 && signature[9] === 0x76 && signature[10] === 0x69) {
      return "avif";
    }

    return "unknown";
  }

  /**
   * Select optimal format based on image characteristics
   */
  private selectOptimalFormat(metadata: ImageMetadata): "webp" | "avif" | "jpeg" | "png" {
    // Use WebP by default for best compression
    if (metadata.hasAlpha || metadata.hasTransparency) {
      return "webp"; // WebP handles transparency well
    }

    // For photographs, WebP or AVIF provide best compression
    if (this.isPhotographicImage(metadata)) {
      return "webp"; // Could use AVIF for even better compression but less support
    }

    // For graphics with sharp edges, PNG might be better
    if (!this.isPhotographicImage(metadata)) {
      return "webp"; // Still use WebP for better compression
    }

    return "webp";
  }

  /**
   * Determine if image is likely a photograph
   */
  private isPhotographicImage(metadata: ImageMetadata): boolean {
    // Heuristic: larger images are more likely photographs
    return metadata.width > 500 && metadata.height > 500;
  }

  /**
   * Generate responsive image sizes
   */
  async generateResponsiveImages(
    imageBuffer: Buffer,
    sizes: Array<{ width: number; height: number; descriptor: string }>
  ): Promise<Array<{ buffer: Buffer; width: number; height: number; descriptor: string; format: string }>> {
    const results = [];

    for (const size of sizes) {
      const optimized = await this.optimizeImage(imageBuffer, {
        width: size.width,
        height: size.height,
        fit: "inside",
      });

      results.push({
        buffer: optimized.buffer,
        width: optimized.width,
        height: optimized.height,
        descriptor: size.descriptor,
        format: optimized.format,
      });
    }

    return results;
  }

  /**
   * Generate low-quality image placeholder (LQIP)
   */
  async generateLQIP(imageBuffer: Buffer, width: number = 64): Promise<string> {
    // Create a very small, low-quality version for placeholder
    const tiny = await this.optimizeImage(imageBuffer, {
      width,
      format: "webp",
      quality: 20,
    });

    // Convert to base64 for inline use
    const base64 = tiny.buffer.toString("base64");
    return `data:image/webp;base64,${base64}`;
  }

  /**
   * Calculate BlurHash for placeholder
   */
  async calculateBlurHash(imageBuffer: Buffer): Promise<string> {
    // In production, use 'blurhash' library
    // return await encode(new Uint8Array(imageBuffer), width, height, 4, 4);

    // Placeholder implementation
    return "L6PZfS]k00D%?w}t8t7XRjayWBj[";
  }
}

// Default optimizer instance
export const defaultOptimizer = new ImageOptimizer();

/**
 * Convenience function to optimize an image
 */
export async function optimizeImage(
  buffer: Buffer,
  options?: Partial<ImageOptimizationOptions>
): Promise<OptimizedImageResult> {
  return defaultOptimizer.optimizeImage(buffer, options);
}

/**
 * Generate WebP URL for Cloudflare R2
 */
export function generateWebPUrl(originalUrl: string, options?: Partial<ImageOptimizationOptions>): string {
  const url = new URL(originalUrl);

  // Add WebP conversion parameters for Cloudflare Image Resizing
  url.searchParams.set("format", "webp");
  url.searchParams.set("quality", (options?.quality || 80).toString());

  if (options?.width) {
    url.searchParams.set("width", options.width.toString());
  }

  if (options?.height) {
    url.searchParams.set("height", options.height.toString());
  }

  if (options?.fit) {
    url.searchParams.set("fit", options.fit);
  }

  return url.toString();
}

/**
 * Generate responsive srcset for images
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: Array<{ width: number; height?: number; descriptor: string }>,
  format: "webp" | "jpeg" | "png" = "webp"
): string {
  return sizes
    .map(size => {
      const url = new URL(baseUrl);
      url.searchParams.set("format", format);
      url.searchParams.set("width", size.width.toString());
      if (size.height) {
        url.searchParams.set("height", size.height.toString());
      }
      return `${url.toString()} ${size.descriptor}`;
    })
    .join(", ");
}