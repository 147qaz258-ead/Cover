"use client";

/**
 * 提示词调试页面
 * 用于测试 CreativeDirector 的输出，不生成图片
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Copy, Check } from "lucide-react";

interface DebugResult {
    fullText: string;
    titleSuggestions: Array<{
        text: string;
        confidence: number;
    }>;
    metadata: {
        platform: string;
        dimensions: { width: number; height: number };
        duration: string;
    };
}

interface VisualStyle {
    id: string;
    name: string;
    description: string;
    category: string;
    isRecommended?: boolean;
}

const PLATFORMS = [
    { id: "xiaohongshu", name: "小红书" },
    { id: "wechat", name: "微信公众号" },
    { id: "douyin", name: "抖音" },
    { id: "weibo", name: "微博" },
    { id: "zhihu", name: "知乎" },
];

export default function PromptDebugPage() {
    const [text, setText] = useState("");
    const [platform, setPlatform] = useState("xiaohongshu");
    const [visualStyleId, setVisualStyleId] = useState<string>("");
    const [visualStyles, setVisualStyles] = useState<VisualStyle[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DebugResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // 获取视觉风格列表
    useEffect(() => {
        async function fetchStyles() {
            try {
                const res = await fetch("/api/visual-styles");
                const data = await res.json();
                if (data.success) {
                    setVisualStyles(data.data);
                    if (data.data.length > 0) {
                        setVisualStyleId(data.data[0].id); // Set default if styles are loaded
                    }
                }
            } catch (err) {
                console.error("获取视觉风格失败:", err);
            }
        }
        fetchStyles();
    }, []);

    const handleSubmit = async () => {
        if (text.trim().length < 10) {
            setError("文本内容至少需要 10 个字符");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/debug/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, platformId: platform, visualStyleId }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "请求失败");
            }

            setResult(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (content: string) => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">🔧 提示词调试</h1>
                    <p className="text-slate-600 mt-2">
                        测试 CreativeDirector 的输出，不生成图片
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 输入区 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">输入</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* 平台选择 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">目标平台</label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PLATFORMS.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 视觉风格选择 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">视觉风格</label>
                                <Select value={visualStyleId} onValueChange={setVisualStyleId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择视觉风格（可选）" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">无特定风格</SelectItem>
                                        {visualStyles.map((style) => (
                                            <SelectItem key={style.id} value={style.id}>
                                                {style.name} {style.isRecommended && "⭐"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {visualStyleId && visualStyleId !== "none" && (
                                    <p className="text-xs text-slate-500">
                                        {visualStyles.find(s => s.id === visualStyleId)?.description}
                                    </p>
                                )}
                            </div>

                            {/* 文本输入 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">文章内容</label>
                                <Textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="输入要分析的文章内容..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                                <p className="text-xs text-slate-500">
                                    已输入 {text.length} 字符（最少 10 字符）
                                </p>
                            </div>

                            {/* 提交按钮 */}
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || text.trim().length < 10}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        分析中...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        发送分析请求
                                    </>
                                )}
                            </Button>

                            {/* 错误提示 */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    {error}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 输出区 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                输出结果
                                {result && (
                                    <Badge variant="secondary">{result.metadata.duration}</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!result && !loading && (
                                <div className="text-center text-slate-400 py-20">
                                    等待输入...
                                </div>
                            )}

                            {loading && (
                                <div className="text-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                                    <p className="text-slate-500 mt-4">正在调用 LLM 分析...</p>
                                </div>
                            )}

                            {result && (
                                <div className="space-y-6">
                                    {/* 完整输出 */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-900">
                                                📄 LLM 完整输出
                                            </h3>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => copyToClipboard(result.fullText)}
                                            >
                                                {copied ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="bg-slate-900 text-green-400 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-auto max-h-[500px] whitespace-pre-wrap">
                                            {result.fullText}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {result.fullText.length} 字符 | 耗时: {result.metadata.duration}
                                        </p>
                                    </div>

                                    {/* 标题建议 */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-slate-900">📝 提取的标题建议</h3>
                                        <div className="space-y-2">
                                            {result.titleSuggestions.map((title, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between bg-slate-100 rounded-lg p-3"
                                                >
                                                    <span className="text-sm">{title.text}</span>
                                                    <Badge
                                                        variant={
                                                            title.confidence > 0.8
                                                                ? "default"
                                                                : title.confidence > 0.6
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                    >
                                                        {Math.round(title.confidence * 100)}%
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 元数据 */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-slate-900">📊 元数据</h3>
                                        <div className="bg-slate-100 rounded-lg p-4 text-sm space-y-1">
                                            <div>
                                                <span className="text-slate-500">平台：</span>
                                                <span className="text-slate-700">{result.metadata.platform}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">尺寸：</span>
                                                <span className="text-slate-700">
                                                    {result.metadata.dimensions.width} x {result.metadata.dimensions.height}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
