"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextInput } from "@/components/forms/text-input";
import { StyleSelector } from "@/components/forms/style-selector";
import { PlatformSelector } from "@/components/forms/platform-selector";
import { ModelSelector } from "@/components/forms/model-selector";
import { VisualStyleSelector } from "@/components/forms/visual-style-selector";
import { MasonryGrid } from "@/components/gallery/masonry-grid";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { CoverGenerationResult } from "@/types";
import { CoverGenerationRequest } from "@/types";
import { Loader2, Wand2, Sparkles, Brush, Menu, X } from "lucide-react";
import { CoverGeneratorErrorBoundary, APIErrorBoundary } from "@/components/ui/error-boundary";
import { useResponsive, touchFriendly, responsiveClasses } from "@/hooks/use-responsive";

interface CoverGeneratorProps {
  onComplete?: (results: CoverGenerationResult[]) => void;
  showInfiniteCanvas?: boolean;
}

interface GenerationState {
  status: "idle" | "generating" | "completed" | "error";
  jobId?: string;
  progress: number;
  currentStep: string;
  results?: CoverGenerationResult[];
  error?: string;
}

interface UIState {
  mode: "simple" | "infinite-canvas";
  sidebarOpen: boolean;
}

const GENERATION_STEPS = [
  { name: "分析文本", key: "analyzing" },
  { name: "生成标题", key: "generating-titles" },
  { name: "创建图片", key: "generating-images" },
  { name: "处理结果", key: "processing" },
];

export function CoverGenerator({ onComplete, showInfiniteCanvas = false }: CoverGeneratorProps) {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("minimal-clean");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["xiaohongshu"]);  // 默认选中小红书
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>();
  const [visualStyleId, setVisualStyleId] = useState<string | undefined>();
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
    progress: 0,
    currentStep: "",
  });
  const [uiState, setUiState] = useState<UIState>({
    mode: "simple",
    sidebarOpen: false,
  });

  const { isMobile: rawIsMobile, isTablet: rawIsTablet, breakpoint, touchSize } = useResponsive();

  // 确保客户端挂载后再应用响应式布局，避免 Hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在挂载前使用默认值（桌面端布局），保证 SSR 与客户端首次渲染一致
  const isMobile = mounted ? rawIsMobile : false;
  const isTablet = mounted ? rawIsTablet : false;

  const isFormValid = text.trim().length >= 10 && selectedPlatforms.length > 0;

  const handleGenerate = async () => {
    if (!isFormValid) return;

    setGenerationState({
      status: "generating",
      progress: 0,
      currentStep: "准备生成...",
    });

    try {
      const request: CoverGenerationRequest = {
        text: text.trim(),
        platforms: selectedPlatforms,
        styleTemplate: selectedStyle,
        modelId: selectedModelId,
        visualStyleId: visualStyleId,
      };

      // Start generation
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to start generation");
      }

      const jobId = data.data.jobId;
      setGenerationState(prev => ({
        ...prev,
        status: "generating",
        jobId,
      }));

      // Poll for progress
      await pollProgress(jobId);

    } catch (error) {
      setGenerationState({
        status: "error",
        progress: 0,
        currentStep: "",
        error: error instanceof Error ? error.message : "生成失败",
      });
    }
  };

  // ==================== 状态映射：后端 → 前端 ====================
  // 后端 job.status: "pending" | "processing" | "completed" | "failed"
  // 前端 generationState.status: "idle" | "generating" | "completed" | "error"
  const mapJobStatusToGenerationStatus = (
    jobStatus: string
  ): GenerationState["status"] => {
    switch (jobStatus) {
      case "pending":
      case "processing":
        return "generating";
      case "completed":
        return "completed";
      case "failed":
        return "error";
      default:
        return "idle";
    }
  };

  // ==================== 轮询进度（带重试机制） ====================
  const pollProgress = async (jobId: string) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to get status");
        }

        // 重置重试计数器
        retryCount = 0;

        const job = data.data;
        const progressSteps = GENERATION_STEPS.map((step, index) => ({
          name: step.name,
          status: job.status === "processing" && Math.floor(job.progress / 25) === index ? "active" :
            job.status === "processing" && Math.floor(job.progress / 25) > index ? "completed" :
              job.status === "completed" ? "completed" :
                job.status === "failed" ? "error" : "pending",
          progress: job.status === "processing" && Math.floor(job.progress / 25) === index ? job.progress % 25 : 0,
        }));

        // 使用状态映射函数转换后端状态为前端状态
        setGenerationState({
          status: mapJobStatusToGenerationStatus(job.status),
          jobId,
          progress: job.progress,
          currentStep: job.status === "processing" ? progressSteps.find(s => s.status === "active")?.name || "处理中" : "",
          results: job.results || [],
          error: job.error,
        });

        if (job.status === "completed") {
          clearInterval(pollInterval);
          onComplete?.(job.results || []);
        } else if (job.status === "failed") {
          clearInterval(pollInterval);
        }
      } catch (error) {
        retryCount++;
        console.warn(`[CoverGenerator] 轮询失败 (${retryCount}/${MAX_RETRIES}):`, error);

        if (retryCount >= MAX_RETRIES) {
          clearInterval(pollInterval);
          setGenerationState({
            status: "error",
            progress: 0,
            currentStep: "",
            error: `连续 ${MAX_RETRIES} 次获取进度失败，请刷新页面重试`,
          });
        }
        // 否则继续轮询，等待下一次 interval
      }
    }, 1000);
  };


  const handleReset = () => {
    setText("");
    setSelectedStyle("minimal-clean");
    setSelectedPlatforms([]);
    setGenerationState({
      status: "idle",
      progress: 0,
      currentStep: "",
    });
  };

  const steps = GENERATION_STEPS.map((step, index) => ({
    name: step.name,
    status: generationState.status === "generating" ?
      Math.floor(generationState.progress / 25) === index ? "active" as const :
        Math.floor(generationState.progress / 25) > index ? "completed" as const : "pending" as const :
      generationState.status === "completed" ? "completed" as const :
        generationState.status === "error" ? "error" as const : "pending" as const,
    progress: generationState.status === "generating" && Math.floor(generationState.progress / 25) === index ?
      generationState.progress % 25 : 0,
  }));

  return (
    <CoverGeneratorErrorBoundary>
      <div className={`${responsiveClasses.container} space-y-4 sm:space-y-6`}>
        {/* Mobile Menu Toggle */}
        {isMobile && generationState.status === "idle" && (
          <div className="flex justify-between items-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUiState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))}
              className={touchFriendly.button}
            >
              {uiState.sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="ml-2">{uiState.sidebarOpen ? "关闭选项" : "打开选项"}</span>
            </Button>
          </div>
        )}

        {/* Header */}
        <Card className={responsiveClasses.card.normal}>
          <CardHeader className={`${isMobile ? 'py-4 text-center' : 'py-6 text-center'}`}>
            <CardTitle className={`flex items-center justify-center gap-2 ${responsiveClasses.text.responsive}`}>
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
              AI 封面生成器
              <Wand2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
            </CardTitle>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'} mt-2`}>
              智能分析文本，一键生成多平台精美封面
            </p>
          </CardHeader>
        </Card>

        {/* Generation Progress */}
        {generationState.status === "generating" && (
          <Card>
            <CardContent className="p-6">
              <ProgressIndicator
                steps={steps}
                overallProgress={generationState.progress}
                currentStep={steps.findIndex(s => s.status === "active")}
                error={generationState.error}
              />
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {generationState.status === "error" && (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="text-destructive text-lg font-medium">生成失败</div>
                <p className="text-muted-foreground">{generationState.error}</p>
                <Button onClick={handleReset} variant="outline">
                  重新开始
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State with Results */}
        {generationState.status === "completed" && generationState.results && (
          <MasonryGrid
            items={generationState.results}
            onDownload={async (cover) => {
              try {
                // 使用 fetch + Blob 方式强制下载
                const response = await fetch(cover.imageUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `${cover.platform.name}_${cover.title}.webp`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // 释放 Blob URL
                URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Download failed:", error);
                // 降级：直接打开链接
                window.open(cover.imageUrl, "_blank");
              }
            }}
          />
        )}

        {/* Mode Toggle */}
        {showInfiniteCanvas && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={uiState.mode === "simple" ? "default" : "outline"}
                  onClick={() => setUiState(prev => ({ ...prev, mode: "simple" }))}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  简单模式
                </Button>
                <Button
                  variant={uiState.mode === "infinite-canvas" ? "default" : "outline"}
                  onClick={() => setUiState(prev => ({ ...prev, mode: "infinite-canvas" }))}
                  className="flex items-center gap-2"
                >
                  <Brush className="w-4 h-4" />
                  无限画布
                </Button>
              </div>
              {uiState.mode === "infinite-canvas" && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  使用无限画布模式自由编辑封面布局
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form or Infinite Canvas */}
        {generationState.status === "idle" && uiState.mode === "simple" && (
          <>
            {/* Mobile Layout */}
            {isMobile ? (
              <div className="space-y-4">
                {/* Text Input - Full width on mobile */}
                <APIErrorBoundary>
                  <TextInput
                    value={text}
                    onChange={setText}
                    onSubmit={handleGenerate}
                    disabled={false}
                    mobile={true}
                  />
                </APIErrorBoundary>

                {/* Collapsible Sidebar */}
                <div className={`${uiState.sidebarOpen ? 'block' : 'hidden'} space-y-4`}>
                  {/* Model Selector */}
                  <APIErrorBoundary>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">图像生成模型</label>
                      <ModelSelector
                        value={selectedModelId}
                        onChange={setSelectedModelId}
                        disabled={false}
                      />
                    </div>
                  </APIErrorBoundary>

                  {/* Style Selector */}
                  <APIErrorBoundary>
                    <StyleSelector
                      selectedTemplate={selectedStyle}
                      onTemplateChange={setSelectedStyle}
                      disabled={false}
                      compact={true}
                    />
                  </APIErrorBoundary>

                  {/* Visual Style Selector */}
                  <APIErrorBoundary>
                    <VisualStyleSelector
                      value={visualStyleId}
                      onChange={setVisualStyleId}
                      disabled={false}
                    />
                  </APIErrorBoundary>

                  {/* Platform Selector */}
                  <APIErrorBoundary>
                    <PlatformSelector
                      selectedPlatforms={selectedPlatforms}
                      onPlatformsChange={setSelectedPlatforms}
                      disabled={false}
                    />
                  </APIErrorBoundary>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!isFormValid}
                    className={`w-full ${responsiveClasses.button.md}`}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    开始生成
                  </Button>

                  {/* Mobile Tips */}
                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md space-y-1">
                    <div>💡 使用提示:</div>
                    <div>• 输入10-10,000字符的文章内容</div>
                    <div>• 选择适合的风格和目标平台</div>
                    <div>• AI将自动优化标题和图片</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Layout */
              <div className={`${responsiveClasses.grid['3']} gap-6`}>
                <div className="lg:col-span-2 space-y-6">
                  {/* Text Input */}
                  <APIErrorBoundary>
                    <TextInput
                      value={text}
                      onChange={setText}
                      onSubmit={handleGenerate}
                      disabled={false}
                    />
                  </APIErrorBoundary>
                </div>

                <div className="space-y-6">
                  {/* Model Selector */}
                  <APIErrorBoundary>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">图像生成模型</label>
                      <ModelSelector
                        value={selectedModelId}
                        onChange={setSelectedModelId}
                        disabled={false}
                      />
                    </div>
                  </APIErrorBoundary>

                  {/* Style Selector */}
                  <APIErrorBoundary>
                    <StyleSelector
                      selectedTemplate={selectedStyle}
                      onTemplateChange={setSelectedStyle}
                      disabled={false}
                    />
                  </APIErrorBoundary>

                  {/* Visual Style Selector */}
                  <APIErrorBoundary>
                    <VisualStyleSelector
                      value={visualStyleId}
                      onChange={setVisualStyleId}
                      disabled={false}
                    />
                  </APIErrorBoundary>

                  {/* Platform Selector */}
                  <APIErrorBoundary>
                    <PlatformSelector
                      selectedPlatforms={selectedPlatforms}
                      onPlatformsChange={setSelectedPlatforms}
                      disabled={false}
                    />
                  </APIErrorBoundary>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!isFormValid}
                    className={`w-full ${responsiveClasses.button.lg}`}
                  >
                    <Wand2 className="w-5 h-5 mr-3" />
                    开始生成
                  </Button>

                  {/* Desktop Tips */}
                  <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg space-y-2">
                    <div>💡 使用提示:</div>
                    <div>• 输入10-10,000字符的文章内容</div>
                    <div>• 选择适合的风格和目标平台</div>
                    <div>• AI将自动优化标题和图片</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Infinite Canvas Mode */}
        {uiState.mode === "infinite-canvas" && (
          <div className="h-[600px]">
            {isFormValid ? (
              <div className="h-full">
                {/* Import InfiniteCanvas when component is available */}
                <div className="h-full flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center space-y-4">
                    <Brush className="w-16 h-16 mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-semibold">无限画布编辑器</h3>
                    <p className="text-muted-foreground">
                      自由拖拽、缩放和旋转文本元素，创建独特的封面设计
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        输入内容: {text.substring(0, 50)}{text.length > 50 && "..."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        风格: {selectedStyle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        平台: {selectedPlatforms.join(", ")}
                      </p>
                    </div>
                    <Button onClick={handleGenerate} disabled={generationState.status === "generating"}>
                      {generationState.status === "generating" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          生成AI辅助封面
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">准备画布编辑器...</p>
                  <p className="text-sm text-muted-foreground">
                    请先输入文本内容并选择平台
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CoverGeneratorErrorBoundary>
  );
}