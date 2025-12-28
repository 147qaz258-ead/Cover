// ==================== 模型列表 API ====================
// GET /api/models - 返回可用的图像生成模型列表
// 
// ⚠️ 重要：按模型名称去重，同名模型只返回优先级最高的
// 用户选择的是模型，不是渠道

import { NextResponse } from "next/server";
import { getModelRegistry, toPublicModelInfo } from "@/lib/ai/config";

/**
 * GET 处理器
 * 返回当前可用的图像生成模型列表（已配置 API Key 的模型）
 * 按模型名称去重，同名模型只返回优先级最高的
 */
export async function GET() {
    try {
        const registry = getModelRegistry();
        const availableModels = registry.getAvailableModels();

        // 转换为公开信息
        const publicModels = availableModels.map(toPublicModelInfo);

        // 按模型名称去重，保留优先级最高的（priority 数值最小）
        const uniqueModels = new Map<string, typeof publicModels[0]>();
        for (const model of publicModels) {
            const existing = uniqueModels.get(model.name);
            if (!existing || model.priority < existing.priority) {
                uniqueModels.set(model.name, model);
            }
        }

        return NextResponse.json({
            success: true,
            data: Array.from(uniqueModels.values()),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            {
                success: false,
                error: message,
            },
            { status: 500 }
        );
    }
}
