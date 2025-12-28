"use client";

import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// ==================== 类型定义 ====================

interface ModelOption {
    id: string;
    name: string;
    provider: string;
    displayProvider?: "google" | "openai" | "flux" | "replicate";
    capabilities: {
        aspectRatios?: string[];
        sizes?: string[];
        maxResolution?: string;
    };
    priority: number;
    isDefault?: boolean;
}

interface ModelSelectorProps {
    /** 当前选中的模型 ID */
    value?: string;
    /** 选中变化回调 */
    onChange: (modelId: string) => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义样式类名 */
    className?: string;
}

// ==================== 辅助函数 ====================

/**
 * 获取 Provider 显示名称
 * 优先使用 displayProvider（模型实际归属），而非 API 渠道
 */
function getProviderLabel(displayProvider?: string, provider?: string): string {
    const key = displayProvider || provider || '';
    const labels: Record<string, string> = {
        google: "Google",
        openai: "OpenAI",
        flux: "Flux",
        replicate: "Replicate",
        // 兼容旧的 provider 值
        "openai-compatible": "OpenAI",
        gemini: "Google",
    };
    return labels[key] || key;
}

/**
 * 获取 Provider 颜色
 */
function getProviderColor(displayProvider?: string, provider?: string): string {
    const key = displayProvider || provider || '';
    const colors: Record<string, string> = {
        google: "bg-blue-100 text-blue-800",
        openai: "bg-green-100 text-green-800",
        flux: "bg-orange-100 text-orange-800",
        replicate: "bg-purple-100 text-purple-800",
        // 兼容旧的 provider 值
        "openai-compatible": "bg-green-100 text-green-800",
        gemini: "bg-blue-100 text-blue-800",
    };
    return colors[key] || "bg-gray-100 text-gray-800";
}

// ==================== 组件 ====================

/**
 * 模型选择器组件
 * 从 /api/models 获取可用模型列表，支持受控模式
 */
export function ModelSelector({
    value,
    onChange,
    disabled = false,
    className,
}: ModelSelectorProps) {
    const [models, setModels] = useState<ModelOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 获取模型列表
    useEffect(() => {
        let cancelled = false;

        async function fetchModels() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("/api/models");
                if (!response.ok) {
                    throw new Error("获取模型列表失败");
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || "未知错误");
                }

                if (!cancelled) {
                    setModels(result.data);

                    // 如果没有选中值，自动选择默认模型
                    if (!value && result.data.length > 0) {
                        const defaultModel = result.data.find(
                            (m: ModelOption) => m.isDefault
                        );
                        if (defaultModel) {
                            onChange(defaultModel.id);
                        } else {
                            onChange(result.data[0].id);
                        }
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "未知错误");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchModels();

        return () => {
            cancelled = true;
        };
    }, []); // 仅在挂载时执行一次

    // 加载状态
    if (loading) {
        return (
            <div className={`flex items-center gap-2 h-10 ${className || ""}`}>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">加载模型...</span>
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <div className={`text-sm text-destructive ${className || ""}`}>
                {error}
            </div>
        );
    }

    // 无可用模型
    if (models.length === 0) {
        return (
            <div className={`text-sm text-muted-foreground ${className || ""}`}>
                无可用模型（请检查 API Key 配置）
            </div>
        );
    }

    // 正常渲染
    return (
        <div className={className}>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="选择图像模型" />
                </SelectTrigger>
                <SelectContent className="min-w-[340px]">
                    {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                                <span className="whitespace-nowrap">{model.name}</span>
                                {model.isDefault && (
                                    <Badge variant="secondary" className="text-xs">
                                        推荐
                                    </Badge>
                                )}
                                <Badge
                                    variant="outline"
                                    className={`text-xs ${getProviderColor(model.displayProvider, model.provider)}`}
                                >
                                    {getProviderLabel(model.displayProvider, model.provider)}
                                </Badge>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
