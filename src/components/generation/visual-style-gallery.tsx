'use client';

/**
 * 视觉风格灵感库组件
 * 以卡片瀑布流形式展示可选的视觉风格
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Palette, Check, AlertCircle, Sparkles } from 'lucide-react';

// ==================== 类型定义 ====================

interface VisualStyleResponse {
    id: string;
    name: string;
    description: string;
    preview: string;
    category: string;
    isRecommended?: boolean;
}

interface VisualStyleGalleryProps {
    /** 当前选中的风格 ID */
    value?: string;
    /** 选中变化回调 */
    onChange: (styleId: string | undefined) => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义样式 */
    className?: string;
}

// ==================== 主组件 ====================

export function VisualStyleGallery({
    value,
    onChange,
    disabled = false,
    className,
}: VisualStyleGalleryProps) {
    const [styles, setStyles] = useState<VisualStyleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    // 从 API 动态获取风格列表
    useEffect(() => {
        fetch('/api/visual-styles')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setStyles(data.data);
                } else {
                    setError(data.error?.message || '获取风格列表失败');
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const selectedStyle = styles.find((s) => s.id === value);

    // 加载中状态
    if (loading) {
        return (
            <section className={cn('py-8', className)}>
                <div className="flex items-center gap-3 mb-6">
                    <Palette className="w-5 h-5 text-violet-600" />
                    <h2 className="text-lg font-semibold text-slate-900">视觉风格灵感库</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                </div>
            </section>
        );
    }

    // 错误状态
    if (error) {
        return (
            <section className={cn('py-8', className)}>
                <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>加载风格失败: {error}</span>
                </div>
            </section>
        );
    }

    return (
        <section className={cn('py-8', className)}>
            {/* 标题区域 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-violet-600" />
                    <h2 className="text-lg font-semibold text-slate-900">视觉风格灵感库</h2>
                    <span className="text-sm text-slate-500">（可选）</span>
                </div>

                {/* 已选择显示 */}
                {selectedStyle && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                            已选择: <span className="font-medium text-violet-600">{selectedStyle.name}</span>
                        </span>
                        <button
                            onClick={() => onChange(undefined)}
                            disabled={disabled}
                            className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                            清除
                        </button>
                    </div>
                )}
            </div>

            {/* 风格卡片网格 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {styles.map((style) => {
                    const isSelected = value === style.id;

                    return (
                        <button
                            key={style.id}
                            onClick={() => onChange(isSelected ? undefined : style.id)}
                            disabled={disabled}
                            className={cn(
                                'group relative rounded-xl overflow-hidden border-2 transition-all duration-200',
                                'hover:shadow-lg hover:scale-[1.02]',
                                'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                                isSelected
                                    ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md'
                                    : 'border-slate-200 hover:border-violet-300',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {/* 预览图片 */}
                            <div className="aspect-[3/4] relative bg-slate-100">
                                <Image
                                    src={style.preview}
                                    alt={style.name}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                {/* 推荐标签 */}
                                {style.isRecommended && (
                                    <span className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                                        <Sparkles className="w-3 h-3" />
                                        推荐
                                    </span>
                                )}

                                {/* 选中覆盖层 */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                                        <div className="bg-violet-600 text-white p-2 rounded-full shadow-lg">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 名称和描述 */}
                            <div className="p-3 bg-white">
                                <div className="font-medium text-sm text-slate-900 truncate">{style.name}</div>
                                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                    {style.description}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* 提示文案 */}
            <p className="mt-4 text-sm text-slate-500 text-center">
                💡 不选择时，AI 将根据内容自动决定风格
            </p>
        </section>
    );
}

export default VisualStyleGallery;
