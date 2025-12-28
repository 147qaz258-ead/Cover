"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProgressStep {
  name: string;
  status: "pending" | "active" | "completed" | "error";
  progress?: number;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  overallProgress: number;
  currentStep?: number;
  error?: string;
  className?: string;
}

export function ProgressIndicator({
  steps,
  overallProgress,
  currentStep = 0,
  error,
  className,
}: ProgressIndicatorProps) {
  const getStatusColor = (status: ProgressStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "active":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: ProgressStep["status"]) => {
    switch (status) {
      case "completed":
        return "✓";
      case "active":
        return "⟳";
      case "error":
        return "✕";
      default:
        return "○";
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">总进度</span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Step Details */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.name}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors",
              step.status === "active" && "bg-blue-50 border border-blue-200",
              step.status === "error" && "bg-red-50 border border-red-200"
            )}
          >
            {/* Step Indicator */}
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all",
                  getStatusColor(step.status)
                )}
              >
                {getStatusIcon(step.status)}
              </div>
            </div>

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{step.name}</span>
                {step.status === "active" && (
                  <Badge variant="secondary" className="text-xs">
                    进行中
                  </Badge>
                )}
                {step.status === "completed" && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    已完成
                  </Badge>
                )}
                {step.status === "error" && (
                  <Badge variant="destructive" className="text-xs">
                    失败
                  </Badge>
                )}
              </div>

              {/* Step Progress */}
              {step.status === "active" && step.progress !== undefined && (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>处理中</span>
                    <span>{step.progress}%</span>
                  </div>
                  <Progress value={step.progress} className="h-1" />
                </div>
              )}

              {/* Error Message */}
              {step.status === "error" && index === currentStep && error && (
                <div className="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Processing Time Info */}
      {steps.some(s => s.status === "active") && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md text-center">
          正在生成封面，请稍候...
        </div>
      )}
    </div>
  );
}