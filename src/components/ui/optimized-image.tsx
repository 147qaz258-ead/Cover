"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { optimizeImage, generateSrcSet } from "@/lib/image/optimization";

interface OptimizedImageProps {
  // Core props
  src: string;
  alt: string;
  width?: number;
  height?: number;

  // Responsive props
  sizes?: string;
  srcSet?: Array<{ width: number; height?: number; descriptor: string }>;

  // Loading props
  loading?: "lazy" | "eager";
  priority?: boolean;

  // Styling props
  className?: string;
  containerClassName?: string;

  // Fallback props
  fallbackSrc?: string;
  placeholder?: "blur" | "empty" | "color";
  blurData?: string;

  // Optimization props
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  optimize?: boolean;

  // Event handlers
  onLoad?: () => void;
  onError?: () => void;
  onLoadStart?: () => void;
}

/**
 * Optimized image component with WebP support and responsive loading
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = "100vw",
  srcSet,
  loading = "lazy",
  priority = false,
  className,
  containerClassName,
  fallbackSrc,
  placeholder = "empty",
  blurData,
  quality = 85,
  format = "webp",
  optimize = true,
  onLoad,
  onError,
  onLoadStart,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default responsive sizes if not provided
  const defaultSrcSet = srcSet || [
    { width: 640, descriptor: "640w" },
    { width: 768, descriptor: "768w" },
    { width: 1024, descriptor: "1024w" },
    { width: 1280, descriptor: "1280w" },
    { width: 1536, descriptor: "1536w" },
  ];

  // Generate WebP srcset
  const webpSrcSet = generateSrcSet(src, defaultSrcSet, "webp");

  // Generate fallback (JPEG) srcset
  const fallbackSrcSet = generateSrcSet(src, defaultSrcSet, "jpeg");

  // Check WebP support
  const [supportsWebP, setSupportsWebP] = useState(true);

  useEffect(() => {
    // Simple WebP support check
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const webpDataUri = canvas.toDataURL("image/webp");
    const support = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    setSupportsWebP(support);

    // Cleanup
    canvas.remove();
  }, []);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setIsLoaded(true);
    setHasError(true);
    onError?.();
  };

  // Handle load start
  const handleLoadStart = () => {
    setIsLoaded(false);
    setHasError(false);
    onLoadStart?.();
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current || loading !== "lazy" || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          // Load the image
          if (supportsWebP && img.dataset.src) {
            img.src = img.dataset.src;
          }
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before it comes into view
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading, priority, supportsWebP]);

  // Get placeholder style
  const getPlaceholderStyle = () => {
    switch (placeholder) {
      case "blur":
        return blurData
          ? { backgroundImage: `url(${blurData})`, backgroundSize: "cover", backgroundPosition: "center" }
          : {};

      case "color":
        return { backgroundColor: "#f3f4f6" };

      case "empty":
      default:
        return {};
    }
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (isLoaded || placeholder === "empty") return null;

    return (
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
        style={getPlaceholderStyle()}
      />
    );
  };

  // Render error state
  const renderError = () => {
    if (!hasError || !fallbackSrc) return null;

    return (
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          className
        )}
        onLoad={handleLoad}
        onError={() => {
          // If fallback also fails, show error state
          setHasError(true);
        }}
      />
    );
  };

  // Determine which image to show
  const shouldShowWebP = supportsWebP && format === "webp";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        containerClassName
      )}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
      }}
    >
      {/* Placeholder */}
      {renderPlaceholder()}

      {/* Picture element for format selection */}
      {shouldShowWebP ? (
        <picture>
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes={sizes}
          />
          <source
            type="image/jpeg"
            srcSet={fallbackSrcSet}
            sizes={sizes}
          />
          <img
            ref={imgRef}
            src={priority ? src : undefined}
            data-src={!priority ? src : undefined}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : loading}
            sizes={sizes}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              hasError ? "opacity-0" : "opacity-100",
              !isLoaded && "opacity-0",
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            onLoadStart={handleLoadStart}
            decoding="async"
          />
        </picture>
      ) : (
        <img
          ref={imgRef}
          src={priority ? src : undefined}
          data-src={!priority ? src : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : loading}
          sizes={sizes}
          srcSet={fallbackSrcSet}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            hasError ? "opacity-0" : "opacity-100",
            !isLoaded && "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          onLoadStart={handleLoadStart}
          decoding="async"
        />
      )}

      {/* Error fallback */}
      {renderError()}

      {/* Loading spinner */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for generating low-quality image placeholders (LQIP)
 */
export function useLQIP(src: string) {
  const [placeholder, setPlaceholder] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src) return;

    setLoading(true);
    fetch(src)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        // In a real implementation, use a blurhash library or generate a tiny WebP
        // For now, we'll create a simple base64 placeholder
        const tinyBuffer = new Uint8Array(buffer);
        const base64 = btoa(String.fromCharCode.apply(null, Array.from(tinyBuffer.slice(0, 1000))));
        setPlaceholder(`data:image/jpeg;base64,${base64}`);
      })
      .catch((error) => {
        console.error("Failed to generate LQIP:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [src]);

  return { placeholder, loading };
}

/**
 * Hook for progressive image loading with blur effect
 */
export function useProgressiveImage(src: string, placeholderSrc?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || "");
  const [loading, setLoading] = useState(!placeholderSrc);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    setLoading(true);
    setError(null);

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };

    img.onerror = () => {
      setError(new Error("Failed to load image"));
      setLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { src: currentSrc, loading, error };
}