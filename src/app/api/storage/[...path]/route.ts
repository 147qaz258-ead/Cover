/**
 * 本地存储图像访问路由
 *
 * 职责：读取 .local-storage 目录中的文件并返回
 * 依赖：Flydrive disk.getBytes()
 *
 * 路由：GET /api/storage/[...path]
 * 示例：GET /api/storage/covers/xiaohongshu/uuid.webp
 */

import { NextRequest, NextResponse } from "next/server";
import { getDisk, STORAGE_MODE } from "@/lib/storage";

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    // 仅在本地存储模式下提供服务
    if (STORAGE_MODE !== "local") {
        return NextResponse.json(
            { error: "Local storage route only available in local mode" },
            { status: 404 }
        );
    }

    try {
        const { path } = await params;
        const key = path.join("/");

        // 安全检查：防止路径遍历攻击
        if (key.includes("..") || key.startsWith("/")) {
            return NextResponse.json(
                { error: "Invalid path" },
                { status: 400 }
            );
        }

        const disk = getDisk();

        // 检查文件是否存在
        const exists = await disk.exists(key);
        if (!exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // 读取文件内容（依赖 Flydrive disk.getBytes）
        const bytes = await disk.getBytes(key);

        // 确定 MIME 类型
        const ext = key.split(".").pop()?.toLowerCase() || "";
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        // 返回文件内容（将 Uint8Array 转换为 Buffer 以兼容 NextResponse）
        return new NextResponse(Buffer.from(bytes), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Content-Length": bytes.length.toString(),
            },
        });
    } catch (error) {
        console.error("Storage route error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
