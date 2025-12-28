/**
 * 存储适配层
 *
 * 架构：胶水式开发
 * - 本地存储：Node.js fs/promises
 * - R2 存储：@aws-sdk/client-s3
 *
 * 根据 STORAGE_MODE 环境变量自动选择驱动
 * 对外接口保持不变，消除 Flydrive ESM/CJS 兼容性问题
 */

import path from "path";
import { StorageDriver } from "./drivers/interface";
import { LocalStorageDriver } from "./drivers/local";
import { R2StorageDriver } from "./drivers/r2";

// ==================== 类型定义 ====================

export interface UploadResult {
    key: string;
    url: string;
    etag?: string;
}

// ==================== 环境配置 ====================

const STORAGE_MODE = process.env.STORAGE_MODE || "local";

// 本地存储根目录（项目根目录下的 .local-storage）
const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), ".local-storage");

// 应用 URL（用于生成本地存储访问 URL）
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ==================== 驱动实例（延迟初始化）====================

let driverInstance: StorageDriver | null = null;

/**
 * 获取存储驱动实例
 * 根据 STORAGE_MODE 选择本地或 R2 驱动
 */
function getDriver(): StorageDriver {
    if (driverInstance) {
        return driverInstance;
    }

    if (STORAGE_MODE === "r2") {
        // R2 模式：使用 Cloudflare R2
        const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
        const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY;
        const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
        const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
        const cdnUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

        if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
            throw new Error(
                "Missing Cloudflare R2 configuration. Required: " +
                "CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, " +
                "CLOUDFLARE_R2_SECRET_KEY, CLOUDFLARE_R2_BUCKET_NAME"
            );
        }

        driverInstance = new R2StorageDriver({
            accountId,
            accessKeyId,
            secretAccessKey,
            bucket,
            cdnUrl,
        });
    } else {
        // 本地模式：使用文件系统
        driverInstance = new LocalStorageDriver({
            rootDir: LOCAL_STORAGE_ROOT,
            baseUrl: APP_URL,
        });
    }

    return driverInstance;
}

// ==================== 公开接口（保持不变）====================

/**
 * 上传文件
 */
export async function uploadImage(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string
): Promise<UploadResult> {
    const driver = getDriver();
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);

    await driver.put(key, buffer, contentType);

    return {
        key,
        url: driver.getUrl(key),
    };
}

/**
 * 删除文件
 */
export async function deleteImage(key: string): Promise<void> {
    const driver = getDriver();
    await driver.delete(key);
}

/**
 * 获取文件内容
 */
export async function getImage(key: string): Promise<Uint8Array | null> {
    const driver = getDriver();
    return driver.get(key);
}

/**
 * 检查文件是否存在
 */
export async function imageExists(key: string): Promise<boolean> {
    const driver = getDriver();
    return driver.exists(key);
}

/**
 * 获取文件公开 URL
 */
export async function getImageUrl(key: string): Promise<string> {
    const driver = getDriver();
    return driver.getUrl(key);
}

// ==================== 导出常量 ====================

export { STORAGE_MODE, LOCAL_STORAGE_ROOT };

/**
 * 获取存储驱动实例（供 API 路由使用）
 * 兼容 Flydrive 风格的 API
 */
export function getDisk() {
    const driver = getDriver();
    return {
        exists: (key: string) => driver.exists(key),
        getBytes: async (key: string) => {
            const data = await driver.get(key);
            return data || new Uint8Array();
        },
        put: (key: string, content: Buffer, contentType: string) =>
            driver.put(key, content, contentType),
        delete: (key: string) => driver.delete(key),
        getUrl: (key: string) => driver.getUrl(key),
    };
}
