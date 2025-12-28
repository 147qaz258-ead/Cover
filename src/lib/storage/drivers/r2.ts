/**
 * Cloudflare R2 存储驱动
 *
 * 依赖：@aws-sdk/client-s3（项目已安装）
 * 职责：将文件存储到 Cloudflare R2
 *
 * 遵循胶水开发原则：所有 S3 操作委托给 AWS SDK
 * R2 兼容 S3 API，可直接使用 S3 客户端
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { StorageDriver, R2StorageConfig } from "./interface";

// ==================== R2StorageDriver ====================

export class R2StorageDriver implements StorageDriver {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly cdnUrl?: string;
    private readonly publicUrl: string;

    constructor(config: R2StorageConfig) {
        this.bucket = config.bucket;
        this.cdnUrl = config.cdnUrl;
        this.publicUrl = `https://${config.bucket}.${config.accountId}.r2.cloudflarestorage.com`;

        // 创建 S3 客户端（R2 兼容 S3 API）
        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }

    /**
     * 上传文件到 R2
     */
    async put(key: string, body: Buffer, contentType: string): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            })
        );
    }

    /**
     * 获取文件内容
     * 文件不存在时返回 null
     */
    async get(key: string): Promise<Buffer | null> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                })
            );

            // 将 ReadableStream 转换为 Buffer
            if (!response.Body) {
                return null;
            }

            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (error: unknown) {
            // 文件不存在时返回 null
            if ((error as { name?: string }).name === "NoSuchKey") {
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
        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                })
            );
        } catch {
            // R2 删除不存在的文件不会报错，这里做防御性处理
        }
    }

    /**
     * 检查文件是否存在
     */
    async exists(key: string): Promise<boolean> {
        try {
            await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                })
            );
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取文件公开访问 URL
     * 优先使用 CDN URL，否则使用 R2 公开 URL
     */
    getUrl(key: string): string {
        if (this.cdnUrl) {
            return `${this.cdnUrl}/${key}`;
        }
        return `${this.publicUrl}/${key}`;
    }
}
