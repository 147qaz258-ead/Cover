'use client';

/**
 * 视觉风格选择器组件
 * 动态从 API 获取风格列表，展示图片预览供用户选择
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Palette, X, AlertCircle, Check } from 'lucide-react';

// ==================== 类型定义 ====================

/** API 返回的类型（不含 promptFragment） */
interface VisualStyleResponse {
    id: string;
    name: string;
    description: string;
    preview: string;
    category: string;
    isRecommended?: boolean;
}

interface VisualStyleSelectorProps {
    value?: string;
    onChange: (styleId: string | undefined) => void;
    disabled?: boolean;
}

// ==================== 组件 ====================

export function VisualStyleSelector({ value, onChange, disabled }: VisualStyleSelectorProps) {
    const [styles, setStyles] = useState<VisualStyleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    // 从 API 动态获取风格列表
    useEffect(() => {
        fetch('/api/visual-styles')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStyles(data.data);
                } else {
                    setError(data.error?.message || '获取风格列表失败');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const selectedStyle = styles.find(s => s.id === value);

    // 加载中状态
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        视觉风格
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // 错误状态
    if (error) {
        return (
            <Card>
                <CardContent className="p-6 flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>加载风格失败: {error}</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        <CardTitle>视觉风格</CardTitle>
                    </div>
                    {value && (
                        <button
                            onClick={() => onChange(undefined)}
                            disabled={disabled}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="清除选择"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <CardDescription>
                    选择一种风格，AI 将参考该风格描述生成图片（可选）
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* 动态渲染风格图片 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {styles.map(style => (
                        <button
                            key={style.id}
                            onClick={() => onChange(value === style.id ? undefined : style.id)}
                            disabled={disabled}
                            className={cn(
                                "relative rounded-lg overflow-hidden border-2 transition-all",
                                "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]",
                                value === style.id
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-muted",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {/* 预览图片 */}
                            <div className="aspect-[3/4] relative bg-muted">
                                <Image
                                    src={style.preview}
                                    alt={style.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                    className="object-cover"
                                />

                                {/* 推荐标签 */}
                                {style.isRecommended && (
                                    <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                                        推荐
                                    </span>
                                )}

                                {/* 选中标识 */}
                                {value === style.id && (
                                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                        <div className="bg-primary text-primary-foreground p-2 rounded-full">
                                            <Check className="h-5 w-5" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 名称和描述 */}
                            <div className="p-3 bg-card">
                                <div className="font-medium text-sm">{style.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                    {style.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* 已选择显示 */}
                {selectedStyle && (
                    <div className="p-3 bg-accent/50 rounded-lg">
                        <p className="text-sm">
                            <span className="font-medium">已选择：</span>
                            {selectedStyle.name}
                        </p>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    💡 不选择时，AI 将根据内容自动决定风格
                </p>
            </CardContent>
        </Card>
    );
}
