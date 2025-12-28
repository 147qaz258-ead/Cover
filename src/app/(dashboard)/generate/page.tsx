'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UnifiedInputSection } from '@/components/generation/unified-input-section';
import { VisualStyleGallery } from '@/components/generation/visual-style-gallery';
import { LivePreview } from '@/components/generation/live-preview';
import { GenerationHistory, saveToHistory } from '@/components/generation/generation-history';
import { MasonryGrid } from '@/components/gallery/masonry-grid';
import { CoverGenerationResult } from '@/types';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
}

const GENERATION_STEPS: GenerationStep[] = [
  { id: 'analyzing', name: '分析文本', status: 'pending' },
  { id: 'generating-titles', name: '生成标题', status: 'pending' },
  { id: 'generating-images', name: '创建图片', status: 'pending' },
  { id: 'processing', name: '处理结果', status: 'pending' },
];

// ==================== 主页面组件 ====================

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generatedItems, setGeneratedItems] = useState<CoverGenerationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [jobId, setJobId] = useState<string>();
  const [steps, setSteps] = useState<GenerationStep[]>(GENERATION_STEPS);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // 配置状态
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['xiaohongshu']);
  const [selectedModelId, setSelectedModelId] = useState<string>();
  const [visualStyleId, setVisualStyleId] = useState<string>();
  const [inputText, setInputText] = useState<string>(''); // Store input text for re-edit

  // 历史记录
  const [historyItems, setHistoryItems] = useState<CoverGenerationResult[]>([]);

  // 处理从 URL 或 sessionStorage 恢复的重新编辑状态
  useEffect(() => {
    // Check for re-edit item in sessionStorage
    const reEditItemStr = sessionStorage.getItem('re-edit-item');
    if (reEditItemStr) {
      try {
        const item: CoverGenerationResult = JSON.parse(reEditItemStr);

        // Restore all state from the item
        if (item.inputText) setInputText(item.inputText);
        if (item.platforms) setSelectedPlatforms(item.platforms);
        if (item.modelId) setSelectedModelId(item.modelId);
        if (item.visualStyleId) setVisualStyleId(item.visualStyleId);

        toast.success('已加载历史配置，可直接重新生成');

        // Clear sessionStorage
        sessionStorage.removeItem('re-edit-item');

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Failed to restore re-edit item:', error);
      }
    }

    // Check for URL params (from lightbox re-edit)
    const platformParam = searchParams.get('platform');
    if (platformParam) {
      setSelectedPlatforms([platformParam]);
    }
  }, [searchParams]);

  // 加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cover_generation_history');
      if (stored) {
        const items: CoverGenerationResult[] = JSON.parse(stored);
        setHistoryItems(items);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  // ==================== 事件处理 ====================

  const handleGenerate = async (text: string) => {
    if (selectedPlatforms.length === 0) {
      toast.error('请至少选择一个平台');
      return;
    }

    // Store input text for re-edit
    setInputText(text);

    setLoading(true);
    setProgress(0);
    setPreviewImages([]);
    setGeneratedItems([]);

    // 重置步骤状态
    setSteps(GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' as const })));

    try {
      const request = {
        text: text.trim(),
        platforms: selectedPlatforms,
        styleTemplate: 'minimal-clean',
        modelId: selectedModelId,
        visualStyleId,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to start generation');
      }

      const newJobId = data.data.jobId;
      setJobId(newJobId);

      // 轮询进度
      const interval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/generate/${newJobId}`);
          const statusData = await statusResponse.json();

          if (!statusResponse.ok) {
            throw new Error('Failed to get status');
          }

          const job = statusData.data;
          const newProgress = job.progress || 0;
          setProgress(newProgress);

          // 更新步骤状态
          const stepIndex = Math.floor(newProgress / 25);
          setSteps((prev) =>
            prev.map((s, i) => {
              if (i < stepIndex) return { ...s, status: 'completed' as const };
              if (i === stepIndex) return { ...s, status: 'active' as const };
              return s;
            })
          );

          // 更新当前步骤名称
          if (job.status === 'processing') {
            const activeStep = steps.find((s) => s.status === 'active');
            setCurrentStep(activeStep?.name || '处理中');
          }

          // 添加预览图片
          if (job.results && job.results.length > 0) {
            const newImages = job.results.map((r: CoverGenerationResult) => r.imageUrl);
            setPreviewImages((prev) => {
              const combined = [...prev, ...newImages];
              return Array.from(new Set(combined));
            });
          }

          if (job.status === 'completed') {
            clearInterval(interval);
            setLoading(false);

            const results: CoverGenerationResult[] = job.results || [];

            // Add generation context to each result for re-edit
            const resultsWithContext = results.map((item) => ({
              ...item,
              inputText: text,
              visualStyleId,
              modelId: selectedModelId,
              platforms: selectedPlatforms,
            }));

            setGeneratedItems(resultsWithContext);

            // 保存到历史（带完整上下文）
            resultsWithContext.forEach((item) => saveToHistory(item));
            setHistoryItems((prev) => [...resultsWithContext, ...prev]);

            toast.success(`成功生成 ${results.length} 个封面`);
          }

          if (job.status === 'failed') {
            clearInterval(interval);
            setLoading(false);
            toast.error('生成失败，请重试');
            setSteps((prev) =>
              prev.map((s) => (s.status === 'active' ? { ...s, status: 'error' as const } : s))
            );
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Generation failed:', error);
      setLoading(false);
      toast.error('生成失败，请重试');
      setSteps((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'error' as const } : s))
      );
    }
  };

  const handleCancel = () => {
    setLoading(false);
    setProgress(0);
    setJobId(undefined);
  };

  const handleDownload = (item: CoverGenerationResult) => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `${item.platform.name}_${item.title}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReEdit = (item: CoverGenerationResult) => {
    // Store the item in sessionStorage for restoration
    sessionStorage.setItem('re-edit-item', JSON.stringify(item));

    // Restore state immediately
    if (item.inputText) setInputText(item.inputText);
    if (item.platforms) setSelectedPlatforms(item.platforms);
    if (item.modelId) setSelectedModelId(item.modelId);
    if (item.visualStyleId) setVisualStyleId(item.visualStyleId);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast.success('已加载历史配置，可直接重新生成');
  };

  const handleDeleteHistory = (id: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePreview = (item: CoverGenerationResult) => {
    window.open(item.imageUrl, '_blank');
  };

  // ==================== 渲染 ====================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <ChevronLeft className="w-4 h-4 mr-1" />
                返回首页
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h1 className="text-lg font-semibold text-slate-900">AI 封面生成</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            {generatedItems.length > 0 && (
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>已生成 {generatedItems.length} 个</span>
              </div>
            )}
            {historyItems.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>历史 {historyItems.length} 条</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 核心输入区 */}
        <section className="mb-8">
          <UnifiedInputSection
            onSubmit={handleGenerate}
            loading={loading}
            selectedPlatforms={selectedPlatforms}
            onPlatformsChange={setSelectedPlatforms}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
          />
        </section>

        {/* 视觉风格灵感库 */}
        <VisualStyleGallery
          value={visualStyleId}
          onChange={setVisualStyleId}
          disabled={loading}
        />

        {/* 生成进度预览 */}
        <AnimatePresence>
          {(loading || jobId) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <LivePreview
                jobStatus={loading ? 'generating' : 'completed'}
                jobId={jobId}
                progress={progress}
                currentStep={currentStep}
                steps={steps}
                previewImages={previewImages}
                onCancel={handleCancel}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* 生成历史 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-8"
        >
          <GenerationHistory
            onReEdit={handleReEdit}
            onPreview={handlePreview}
            onDelete={handleDeleteHistory}
            maxItems={5}
          />
        </motion.section>

        {/* 生成结果网格 */}
        <AnimatePresence>
          {generatedItems.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <MasonryGrid
                items={generatedItems}
                onDownload={handleDownload}
                onPreview={handlePreview}
                onEdit={handleReEdit}
                enableFilters={true}
                enableSelection={true}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
