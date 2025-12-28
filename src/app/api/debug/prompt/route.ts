/**
 * 提示词调试 API
 * 仅调用 CreativeDirector LLM，不生成图片
 */

import { NextRequest, NextResponse } from "next/server";
import { getCoverCreativeDirector } from "@/lib/ai/pipeline";
import { getPlatform } from "@/lib/platforms/specs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, platformId = "xiaohongshu", visualStyleId } = body;

        if (!text || text.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: "文本内容至少需要 10 个字符" },
                { status: 400 }
            );
        }

        const platform = getPlatform(platformId);
        if (!platform) {
            return NextResponse.json(
                { success: false, error: `平台不存在: ${platformId}` },
                { status: 400 }
            );
        }

        console.log("\n[DebugPrompt] ==================== 调试请求 ====================");
        console.log(`[DebugPrompt] 📄 文本长度: ${text.length} 字符`);
        console.log(`[DebugPrompt] 📱 平台: ${platform.name}`);
        console.log(`[DebugPrompt] 🎨 视觉风格: ${visualStyleId || "无"}`);

        const director = getCoverCreativeDirector();
        const startTime = Date.now();

        const result = await director.analyze({
            userContent: text,
            platform,
            visualStylePrompt: visualStyleId,
        });

        const duration = Date.now() - startTime;

        console.log(`[DebugPrompt] ✅ 分析完成，耗时 ${duration}ms`);
        console.log(`[DebugPrompt] 📝 标题数量: ${result.titleSuggestions.length}`);
        console.log(`[DebugPrompt] 🖼️ 输出文本长度: ${result.fullText.length} 字符`);

        return NextResponse.json({
            success: true,
            data: {
                fullText: result.fullText,
                titleSuggestions: result.titleSuggestions,
                metadata: {
                    platform: platform.name,
                    dimensions: platform.dimensions,
                    duration: `${duration}ms`,
                },
            },
        });
    } catch (error) {
        console.error("[DebugPrompt] ❌ 错误:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "未知错误",
            },
            { status: 500 }
        );
    }
}
