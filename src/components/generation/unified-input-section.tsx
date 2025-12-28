'use client';

/**
 * 统一输入区组件
 * 核心创作入口，包含输入框 + 模型选择 + 平台选择 + 生成按钮
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/forms/model-selector';
import { PlatformPills } from '@/components/generation/platform-pills';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

interface UnifiedInputSectionProps {
    /** 提交回调 */
    onSubmit: (text: string) => void;
    /** 是否正在生成 */
    loading?: boolean;
    /** 输入框占位符 */
    placeholder?: string;
    /** 最小字符数 */
    minLength?: number;
    /** 已选平台 */
    selectedPlatforms: string[];
    /** 平台变化回调 */
    onPlatformsChange: (platforms: string[]) => void;
    /** 已选模型 ID */
    selectedModelId?: string;
    /** 模型变化回调 */
    onModelChange: (modelId: string) => void;
    /** 自定义样式 */
    className?: string;
}

// ==================== 主组件 ====================

export function UnifiedInputSection({
    onSubmit,
    loading = false,
    placeholder = '输入您的文章内容，AI 将为您生成精美的社交媒体封面...',
    minLength = 10,
    selectedPlatforms,
    onPlatformsChange,
    selectedModelId,
    onModelChange,
    className,
}: UnifiedInputSectionProps) {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const isValid = text.trim().length >= minLength && selectedPlatforms.length > 0;

    const handleSubmit = useCallback(() => {
        if (isValid && !loading) {
            onSubmit(text.trim());
        }
    }, [isValid, loading, onSubmit, text]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={cn('w-full', className)}>
            {/* 主输入卡片 */}
            <div
                className={cn(
                    'relative bg-white rounded-2xl border transition-all duration-300',
                    isFocused
                        ? 'shadow-xl border-violet-300 ring-4 ring-violet-500/10'
                        : 'shadow-lg border-slate-200 hover:border-slate-300'
                )}
            >
                {/* 输入区域 */}
                <div className="p-6 pb-4">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={loading}
                        className={cn(
                            'min-h-[140px] resize-none text-base border-0 p-0',
                            'focus-visible:ring-0 focus-visible:shadow-none',
                            'placeholder:text-slate-400'
                        )}
                    />
                </div>

                {/* 分隔线 */}
                <div className="mx-6 border-t border-slate-100" />

                {/* 工具栏区域 */}
                <div className="p-4 space-y-4">
                    {/* 第一行：模型选择 + 生成按钮 */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* 模型选择器 - 增加宽度 */}
                            <ModelSelector
                                value={selectedModelId}
                                onChange={onModelChange}
                                disabled={loading}
                            />
                        </div>

                        {/* 字符计数 + 生成按钮 */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">
                                {text.length < minLength ? (
                                    <span className="text-amber-600">
                                        还需 {minLength - text.length} 字符
                                    </span>
                                ) : (
                                    <span className="text-green-600">
                                        ⌘+Enter 快捷生成
                                    </span>
                                )}
                            </span>

                            <Button
                                onClick={handleSubmit}
                                disabled={!isValid || loading}
                                size="lg"
                                className={cn(
                                    'h-11 px-6 font-medium shadow-md transition-all duration-200',
                                    'bg-gradient-to-r from-violet-600 to-indigo-600',
                                    'hover:from-violet-700 hover:to-indigo-700',
                                    'disabled:opacity-50 disabled:cursor-not-allowed'
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        生成封面
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* 第二行：平台选择 Pills */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 whitespace-nowrap">目标平台:</span>
                        <PlatformPills
                            selectedPlatforms={selectedPlatforms}
                            onPlatformsChange={onPlatformsChange}
                            disabled={loading}
                            maxVisible={6}
                        />
                    </div>
                </div>
            </div>

            {/* 快捷提示 */}
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-500">
                <span>💡 至少选择一个平台</span>
                <span>·</span>
                <span>📝 输入 10-10,000 字符的内容</span>
                <span>·</span>
                <span>🎨 AI 将自动优化标题和排版</span>
            </div>
        </div>
    );
}

export default UnifiedInputSection;
