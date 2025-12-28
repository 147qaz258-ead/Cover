/**
 * 视觉风格 API 路由
 * GET /api/visual-styles - 返回风格列表（不含 promptFragment）
 * GET /api/visual-styles?category=realistic - 按分类筛选
 */

import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api/response';
import {
    getVisualStyleTemplatesForAPI,
    getVisualStylesByCategory,
} from '@/lib/ai/prompts/visual-styles';
import { VisualStyleCategory } from '@/types/visual-style';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') as VisualStyleCategory | null;

        // 返回的数据不含 promptFragment
        const templates = category
            ? getVisualStylesByCategory(category)
            : getVisualStyleTemplatesForAPI();

        console.log(`[API /visual-styles] 返回 ${templates.length} 个风格模板`);

        return ApiResponse.success(templates);
    } catch (error) {
        console.error('[API /visual-styles] Error:', error);
        return ApiResponse.error(
            error instanceof Error ? error : new Error('获取视觉风格列表失败'),
            500
        );
    }
}
