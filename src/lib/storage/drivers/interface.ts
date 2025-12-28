/**
 * 存储驱动接口定义
 *
 * 统一本地存储和 R2 云存储的 API
 * 遵循胶水开发原则：接口简洁，实现委托给原生库
 */

// ==================== 驱动接口 ====================

export interface StorageDriver {
    /**
     * 上传文件
     * @param key - 文件路径（如 covers/xxx.webp）
     * @param body - 文件内容
     * @param contentType - MIME 类型
     */
    put(key: string, body: Buffer, contentType: string): Promise<void>;

    /**
     * 获取文件内容
     * @returns 文件内容，不存在返回 null
     */
    get(key: string): Promise<Buffer | null>;

    /**
     * 删除文件
     */
    delete(key: string): Promise<void>;

    /**
     * 检查文件是否存在
     */
    exists(key: string): Promise<boolean>;

    /**
     * 获取文件公开访问 URL
     */
    getUrl(key: string): string;
}

// ==================== 配置接口 ====================

export interface LocalStorageConfig {
    /** 本地存储根目录 */
    rootDir: string;
    /** 应用 URL（用于生成访问路径） */
    baseUrl: string;
}

export interface R2StorageConfig {
    /** Cloudflare 账户 ID */
    accountId: string;
    /** Access Key ID */
    accessKeyId: string;
    /** Secret Access Key */
    secretAccessKey: string;
    /** 存储桶名称 */
    bucket: string;
    /** CDN URL（可选） */
    cdnUrl?: string;
}
