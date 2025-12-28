/**
 * 本地文件系统存储驱动
 *
 * 依赖：Node.js fs/promises（内置）
 * 职责：将文件存储到本地 .local-storage 目录
 *
 * 遵循胶水开发原则：所有 I/O 操作委托给 Node.js 原生 fs 模块
 */

import { promises as fs } from "fs";
import path from "path";
import { StorageDriver, LocalStorageConfig } from "./interface";

// ==================== LocalStorageDriver ====================

export class LocalStorageDriver implements StorageDriver {
    private readonly rootDir: string;
    private readonly baseUrl: string;

    constructor(config: LocalStorageConfig) {
        this.rootDir = config.rootDir;
        this.baseUrl = config.baseUrl;
    }

    /**
     * 上传文件到本地存储
     * 自动创建父目录
     */
    async put(key: string, body: Buffer, _contentType: string): Promise<void> {
        const filePath = path.join(this.rootDir, key);
        const dir = path.dirname(filePath);

        // 确保目录存在（递归创建）
        await fs.mkdir(dir, { recursive: true });

        // 写入文件
        await fs.writeFile(filePath, body);
    }

    /**
     * 获取文件内容
     * 文件不存在时返回 null
     */
    async get(key: string): Promise<Buffer | null> {
        const filePath = path.join(this.rootDir, key);
        try {
            return await fs.readFile(filePath);
        } catch (error: unknown) {
            // 文件不存在时返回 null
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    /**
     * 删除文件
     * 文件不存在时静默忽略
     */
    async delete(key: string): Promise<void> {
        const filePath = path.join(this.rootDir, key);
        try {
            await fs.unlink(filePath);
        } catch (error: unknown) {
            // 文件不存在时忽略
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                throw error;
            }
        }
    }

    /**
     * 检查文件是否存在
     */
    async exists(key: string): Promise<boolean> {
        const filePath = path.join(this.rootDir, key);
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取文件公开访问 URL
     * 通过 /api/storage 路由访问
     */
    getUrl(key: string): string {
        return `${this.baseUrl}/api/storage/${key}`;
    }
}
