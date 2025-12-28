"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface GenerationStep {
  id: string;
  name: string;
  status: "pending" | "active" | "completed" | "error";
  progress?: number;
}

interface LivePreviewProps {
  jobStatus: "idle" | "generating" | "completed" | "failed";
  jobId?: string;
  progress: number;
  currentStep: string;
  steps?: GenerationStep[];
  previewImages?: string[];
  onCancel?: () => void;
  className?: string;
}

const DEFAULT_STEPS: GenerationStep[] = [
  { id: "analyzing", name: "分析文本", status: "pending" },
  { id: "generating-titles", name: "生成标题", status: "pending" },
  { id: "generating-images", name: "创建图片", status: "pending" },
  { id: "processing", name: "处理结果", status: "pending" },
];

export function LivePreview({
  jobStatus,
  jobId,
  progress,
  currentStep,
  steps = DEFAULT_STEPS,
  previewImages = [],
  onCancel,
  className,
}: LivePreviewProps) {
  // Update step statuses based on progress
  const getStepsWithStatus = (): GenerationStep[] => {
    const stepIndex = Math.floor(progress / 25);
    return steps.map((step, index) => {
      if (jobStatus === "failed") {
        return index < stepIndex ? { ...step, status: "completed" as const } : step;
      }
      if (jobStatus === "completed") {
        return { ...step, status: "completed" as const };
      }
      if (index < stepIndex) {
        return { ...step, status: "completed" as const };
      }
      if (index === stepIndex) {
        return {
          ...step,
          status: "active" as const,
          progress: progress % 25,
        };
      }
      return step;
    });
  };

  const stepsWithStatus = getStepsWithStatus();
  const activeStep = stepsWithStatus.find((s) => s.status === "active");

  if (jobStatus === "idle") {
    return null;
  }

  return (
    <Card className={cn("border-slate-200", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {jobStatus === "generating" && (
              <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            )}
            {jobStatus === "completed" && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            {jobStatus === "failed" && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h3 className="font-semibold text-slate-900">
                {jobStatus === "generating" && "正在生成封面..."}
                {jobStatus === "completed" && "生成完成！"}
                {jobStatus === "failed" && "生成失败"}
              </h3>
              {jobStatus === "generating" && activeStep && (
                <p className="text-sm text-slate-600">{activeStep.name}</p>
              )}
            </div>
          </div>

          {jobStatus === "generating" && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-slate-600"
            >
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {jobStatus === "generating" && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">进度</span>
              <span className="font-medium text-slate-900">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {stepsWithStatus.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  step.status === "pending" && "bg-slate-100 text-slate-400",
                  step.status === "active" && "bg-yellow-100 text-yellow-700",
                  step.status === "completed" && "bg-green-100 text-green-700",
                  step.status === "error" && "bg-red-100 text-red-700"
                )}
              >
                {step.status === "completed" && (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="w-4 h-4" />
                )}
                {step.status === "active" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {step.status === "pending" && (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step.status === "active" && "text-yellow-700",
                      step.status === "completed" && "text-green-700",
                      step.status === "error" && "text-red-700"
                    )}
                  >
                    {step.name}
                  </span>
                  {step.status === "active" && step.progress !== undefined && (
                    <span className="text-xs text-slate-500">{Math.round(step.progress)}%</span>
                  )}
                </div>
                {step.status === "active" && (
                  <Progress value={step.progress} className="h-1" />
                )}
                {step.status === "completed" && (
                  <div className="h-1 bg-green-500 rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Preview Images */}
        <AnimatePresence>
          {(previewImages.length > 0 || jobStatus === "completed") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">预览</span>
                  {previewImages.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {previewImages.length}
                    </Badge>
                  )}
                </div>

                {previewImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {previewImages.map((src, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-square bg-slate-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={src}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : jobStatus === "completed" ? (
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                      <p className="text-sm">生成完成！</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">预览图生成中...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default LivePreview;
