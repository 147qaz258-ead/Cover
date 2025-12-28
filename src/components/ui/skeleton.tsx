import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "default" | "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  lines?: number;
  lineHeight?: string | number;
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animation = "pulse",
  lines,
  lineHeight,
  ...props
}: SkeletonProps) {
  if (variant === "text" && lines) {
    return (
      <div className={cn("space-y-1", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-muted rounded",
              animation === "pulse" && "animate-pulse",
              animation === "wave" && "animate-shimmer",
              width || "100%",
              height,
              lineHeight && `leading-[${lineHeight}]`
            )}
            style={{
              width: i === lines - 1 ? `${Math.random() * 60 + 40}%` : width,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circular") {
    return (
      <div
        className={cn(
          "rounded-full bg-muted",
          animation === "pulse" && "animate-pulse",
          animation === "wave" && "animate-shimmer",
          width,
          height,
          className
        )}
        {...props}
        style={{
          width: width || height,
          height: height || width,
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-muted rounded",
        animation === "pulse" && "animate-pulse",
        animation === "wave" && "animate-shimmer",
        width,
        height,
        className
      )}
      {...props}
    />
  );
}

interface CardSkeletonProps {
  showAvatar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
  avatarSize?: "sm" | "md" | "lg";
  className?: string;
}

export function CardSkeleton({
  showAvatar = false,
  showHeader = true,
  showFooter = false,
  lines = 3,
  avatarSize = "md",
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton
            variant="circular"
            width={
              avatarSize === "sm" ? 40 : avatarSize === "md" ? 48 : 64
            }
            height={
              avatarSize === "sm" ? 40 : avatarSize === "md" ? 48 : 64
            }
          />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      )}

      {/* Header */}
      {showHeader && <Skeleton width="40%" height={24} />}

      {/* Content */}
      <Skeleton variant="text" lines={lines} />

      {/* Footer */}
      {showFooter && (
        <div className="flex items-center justify-between">
          <Skeleton width="20%" height={20} />
          <Skeleton width="20%" height={20} />
        </div>
      )}
    </div>
  );
}

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 5,
  showAvatar = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          {showAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width={index % 3 === 0 ? "80%" : "100%"} height={16} />
            <Skeleton width={index % 3 === 1 ? "60%" : "40%"} height={12} />
            <Skeleton width="30%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex border-b">
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={`header-${index}`}
              className="flex-1 p-4 font-medium text-sm text-muted-foreground border-r last:border-r-0"
            >
              <Skeleton width="40%" height={16} />
            </div>
          ))}
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex border-b last:border-b-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="flex-1 p-4 border-r last:border-r-0"
            >
              <Skeleton
                width={colIndex === 0 ? "20%" : colIndex === columns - 1 ? "30%" : "60%"}
                height={14}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Add shimmer animation styles (client-side only)
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }

    .animate-shimmer {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite;
    }
  `;
  document.head.appendChild(style);
}

export default Skeleton;