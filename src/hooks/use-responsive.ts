"use client";

import { useState, useEffect } from "react";
import {
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  isTouchDevice,
  getViewportWidth,
  getViewportHeight,
  getResponsiveValue,
  getOrientation,
  isPortrait,
  isLandscape,
  type Breakpoint,
  BREAKPOINTS,
  BREAKPOINT_ORDER,
} from "@/lib/utils/responsive";

/**
 * Hook for responsive design utilities
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Update window size and orientation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setOrientation(isPortrait() ? 'portrait' : 'landscape');
    };

    // Set initial size
    updateSize();

    // Add event listeners
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  // Device type checks
  const deviceType = getDeviceType();
  const mobile = isMobile();
  const tablet = isTablet();
  const desktop = isDesktop();
  const touch = isTouchDevice();

  // Breakpoint checks
  const breakpoint = (() => {
    if (windowSize.width < 640) return 'xs';
    if (windowSize.width < 768) return 'sm';
    if (windowSize.width < 1024) return 'md';
    if (windowSize.width < 1280) return 'lg';
    if (windowSize.width < 1536) return 'xl';
    return '2xl';
  })() as Breakpoint;

  const breakpointChecks = {
    isXs: windowSize.width < 475,
    isSm: windowSize.width >= 640 && windowSize.width < 768,
    isMd: windowSize.width >= 768 && windowSize.width < 1024,
    isLg: windowSize.width >= 1024 && windowSize.width < 1280,
    isXl: windowSize.width >= 1280 && windowSize.width < 1536,
    is2Xl: windowSize.width >= 1536,
  };

  // Responsive value selector
  const getValue = <T,>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T => {
    return getResponsiveValue(values, defaultValue);
  };

  // Grid columns based on breakpoint
  const getGridCols = (config: Partial<Record<Breakpoint, number>>, defaultCols = 1): string => {
    const cols = getValue(config, defaultCols);
    return `grid-cols-1 sm:grid-cols-${Math.min(config.sm || 1, 12)} md:grid-cols-${Math.min(config.md || config.sm || 1, 12)} lg:grid-cols-${Math.min(config.lg || config.md || config.sm || 1, 12)} xl:grid-cols-${Math.min(config.xl || config.lg || config.md || config.sm || 1, 12)}`;
  };

  // Touch-friendly sizing
  const touchSize = mobile ? 44 : 32; // Minimum touch target size

  return {
    // Window properties
    width: windowSize.width,
    height: windowSize.height,
    orientation,

    // Device checks
    deviceType,
    isMobile: mobile,
    isTablet: tablet,
    isDesktop: desktop,
    isTouch: touch,

    // Breakpoint information
    breakpoint,
    ...breakpointChecks,

    // Orientation checks
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',

    // Utilities
    getValue,
    getGridCols,
    touchSize,
  };
}

/**
 * Touch-friendly CSS class utilities
 */
export const touchFriendly = {
  interactive: "min-h-[44px] min-w-[44px]",
  button: "min-h-[44px] min-w-[44px]",
  input: "min-h-[44px]",
  link: "min-h-[44px] py-2",
};

/**
 * Responsive CSS class utilities
 */
export const responsiveClasses = {
  container: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  card: {
    compact: "p-3 sm:p-4",
    normal: "p-4 sm:p-6",
    spacious: "p-6 sm:p-8 lg:p-10",
  },
  button: {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  },
  text: {
    responsive: "text-lg sm:text-xl lg:text-2xl",
    heading: "text-xl sm:text-2xl lg:text-3xl font-bold",
    subheading: "text-sm sm:text-base text-muted-foreground",
  },
  grid: {
    "2": "grid grid-cols-1 md:grid-cols-2",
    "3": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  },
};

/**
 * Hook for responsive grid layout
 */
export function useResponsiveGrid(config: {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
  gap?: 'tight' | 'normal' | 'loose';
}) {
  const { breakpoint, getGridCols } = useResponsive();

  const gridCols = getGridCols(config, 1);

  const gapClass = {
    tight: 'gap-2 sm:gap-3 md:gap-4',
    normal: 'gap-3 sm:gap-4 md:gap-6',
    loose: 'gap-4 sm:gap-6 md:gap-8',
  }[config.gap || 'normal'];

  return {
    className: `grid ${gridCols} ${gapClass}`,
    cols: config[breakpoint] || 1,
  };
}

/**
 * Hook for responsive image loading
 */
export function useResponsiveImage(src: string, options?: {
  formats?: string[];
  quality?: number;
  sizes?: Partial<Record<Breakpoint, string>>;
}) {
  const { isMobile, getValue } = useResponsive();

  const formats = options?.formats || ['webp', 'jpg'];
  const quality = options?.quality || 80;

  const sizes = getValue(options?.sizes || {
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
  }, '100vw');

  const srcSet = formats.map(format =>
    `${src}?format=${format}&quality=${quality}&w=400 400w,
     ${src}?format=${format}&quality=${quality}&w=800 800w,
     ${src}?format=${format}&quality=${quality}&w=1200 1200w`
  ).join(', ');

  return {
    src,
    srcSet,
    sizes,
    loading: isMobile ? 'lazy' : 'eager' as const,
    decoding: 'async' as const,
  };
}

/**
 * Hook for touch gestures
 */
export function useTouchGestures(elementRef: React.RefObject<HTMLElement>) {
  const { isTouch } = useResponsive();
  const [gesture, setGesture] = useState<{
    type: 'swipe' | 'pinch' | null;
    direction?: 'left' | 'right' | 'up' | 'down';
    distance?: number;
  }>({ type: null });

  useEffect(() => {
    if (!isTouch || !elementRef.current) return;

    const element = elementRef.current;
    let startX = 0;
    let startY = 0;
    let initialDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        initialDistance = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Minimum swipe distance
        if (distance > 50) {
          const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
          let direction: 'left' | 'right' | 'up' | 'down';

          if (angle > -45 && angle <= 45) direction = 'right';
          else if (angle > 45 && angle <= 135) direction = 'down';
          else if (angle > 135 || angle <= -135) direction = 'left';
          else direction = 'up';

          setGesture({ type: 'swipe', direction, distance });
        }
      }
      // Reset gesture after a short delay
      setTimeout(() => setGesture({ type: null }), 100);
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouch, elementRef]);

  return gesture;
}