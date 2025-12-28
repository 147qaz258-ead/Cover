/**
 * Responsive design utilities and hooks
 */

// Breakpoint values (matching Tailwind CSS)
export const BREAKPOINTS = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Breakpoint order for media queries
export const BREAKPOINT_ORDER = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export type Breakpoint = typeof BREAKPOINT_ORDER[number];

// Device detection utilities
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'unknown';

  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'desktop';
  return 'large-desktop';
};

export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 640;
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 640 && window.innerWidth < 1024;
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
};

// Touch detection
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Viewport utilities
export const getViewportHeight = () => {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight;
};

export const getViewportWidth = () => {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth;
};

// Responsive value selector
export const getResponsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T => {
  if (typeof window === 'undefined') return defaultValue;

  const width = window.innerWidth;

  // Find the largest breakpoint that fits
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const breakpoint = BREAKPOINT_ORDER[i];
    const value = values[breakpoint];
    if (value !== undefined) {
      // Convert breakpoint to numeric value for comparison
      const breakpointValue = parseInt(BREAKPOINTS[breakpoint]);
      if (width >= breakpointValue) {
        return value;
      }
    }
  }

  return defaultValue;
};

// CSS class utilities for responsive patterns
export const responsiveClasses = {
  // Container
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  // Grid layouts
  grid: {
    '1': 'grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1',
    '2': 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4',
    'auto-fit': 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
    'auto-fill': 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
  },

  // Text sizes
  text: {
    xs: 'text-xs sm:text-xs md:text-xs lg:text-xs xl:text-xs',
    sm: 'text-sm sm:text-sm md:text-sm lg:text-sm xl:text-sm',
    base: 'text-base sm:text-base md:text-base lg:text-base xl:text-base',
    lg: 'text-lg sm:text-lg md:text-lg lg:text-lg xl:text-lg',
    xl: 'text-xl sm:text-xl md:text-xl lg:text-xl xl:text-xl',
    '2xl': 'text-2xl sm:text-2xl md:text-2xl lg:text-2xl xl:text-2xl',
    '3xl': 'text-3xl sm:text-3xl md:text-3xl lg:text-3xl xl:text-3xl',
    responsive: 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl',
  },

  // Spacing
  spacing: {
    tight: 'p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6',
    normal: 'p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12',
    loose: 'p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16',
  },

  // Button sizes
  button: {
    sm: 'h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm md:h-10 md:px-6 md:text-base',
    md: 'h-10 px-4 text-sm sm:h-11 sm:px-6 sm:text-base md:h-12 md:px-8 md:text-lg',
    lg: 'h-12 px-6 text-base sm:h-14 sm:px-8 sm:text-lg md:h-16 md:px-12 md:text-xl',
  },

  // Card layouts
  card: {
    compact: 'rounded-lg shadow-sm p-3 sm:p-4 md:p-5 lg:p-6',
    normal: 'rounded-xl shadow-md p-4 sm:p-6 md:p-8 lg:p-10',
    spacious: 'rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 lg:p-12',
  },
};

// Touch-friendly utilities
export const touchFriendly = {
  // Minimum touch target size (44px x 44px as per Apple HIG)
  button: 'min-h-[44px] min-w-[44px]',
  interactive: 'min-h-[44px]',
  input: 'min-h-[48px] p-3 sm:p-4',

  // Touch-friendly spacing
  spacing: {
    tight: 'gap-2 sm:gap-3',
    normal: 'gap-3 sm:gap-4',
    loose: 'gap-4 sm:gap-6',
  },

  // Touch gestures
  swipe: 'touch-pan-y',
  pinch: 'touch-pinch-zoom',
};

// Performance optimizations for mobile
export const mobileOptimizations = {
  // Reduce motion for users who prefer it
  reduceMotion: 'motion-reduce:transition-none motion-reduce:animation-none',

  // Optimized images
  image: 'w-full h-auto object-cover',

  // Lazy loading
  lazy: 'loading="lazy"',

  // Hardware acceleration
  accelerate: 'transform-gpu will-change-transform',
};

// Orientation utilities
export const getOrientation = () => {
  if (typeof window === 'undefined') return 'unknown';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

export const isPortrait = () => {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
};

export const isLandscape = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};