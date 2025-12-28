# 存储架构文档

> 本文档系统性描述 Cover 项目的图像存储架构，包括现有 R2 云存储和本地存储扩展设计。

---

## 目的 Purpose

为开发者和 AI 提供存储系统的**完整技术视图**，支撑未来存储后端扩展与维护。

## 适用范围 Scope

- 存储层架构设计
- 现有 R2 存储实现
- 本地存储扩展设计
- 存储适配层接口规范
- 扩展指南

---

## 1. 架构概览

### 1.1 历史架构（Before - 已弃用）

```
┌─────────────────────────────────────────────────────────────────┐
│                       IMAGE GENERATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │  ImageGenerationAgent │───►│  AI Provider (OpenAI/Gemini) │   │
│  │  image-generator.ts   │    │  返回临时 URL 或 Buffer      │   │
│  └──────────┬───────────┘    └──────────────────────────────┘   │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐                                       │
│  │  saveImageToR2()     │  ← 方法名硬编码耦合 R2                 │
│  │  下载 → 优化 → 上传   │                                       │
│  └──────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │  optimizeImage()     │───►│  ImageOptimizer              │   │
│  │  image/optimization  │    │  WebP 转换、压缩、缩放        │   │
│  └──────────┬───────────┘    └──────────────────────────────┘   │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │  uploadToR2()        │───►│  Cloudflare R2               │   │
│  │  storage/r2.ts       │    │  AWS S3 兼容 API             │   │
│  └──────────────────────┘    └──────────────────────────────┘   │
│                                         │                        │
│                                         ▼                        │
│                              ┌──────────────────────────────┐   │
│                              │  公开 URL                     │   │
│                              │  https://xxx.r2.dev/...      │   │
│                              └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 当前架构（After - 已实现）

```
┌─────────────────────────────────────────────────────────────────┐
│                       IMAGE GENERATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │  ImageGenerationAgent │───►│  AI Provider (OpenAI/Gemini) │   │
│  │  image-generator.ts   │    │  返回临时 URL 或 Buffer      │   │
│  └──────────┬───────────┘    └──────────────────────────────┘   │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐                                       │
│  │  saveImage()         │  ← 抽象方法，不绑定具体实现            │
│  │  下载 → 优化 → 上传   │                                       │
│  └──────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐                                       │
│  │  uploadImage()       │  ← 统一接口                           │
│  │  storage/index.ts    │                                       │
│  └──────────┬───────────┘                                       │
│             │                                                    │
│      ┌──────┴──────┐         STORAGE_MODE 环境变量               │
│      │             │                                             │
│      ▼             ▼                                             │
│  ┌────────┐   ┌────────┐                                        │
│  │ local  │   │   r2   │   ← 可扩展：s3, oss, minio...          │
│  └───┬────┘   └───┬────┘                                        │
│      │            │                                              │
│      ▼            ▼                                              │
│  ┌────────────────────────┐  ┌──────────────────────────────┐   │
│  │  .local-storage/       │  │  Cloudflare R2               │   │
│  │  本地文件系统           │  │  AWS S3 兼容 API             │   │
│  └────────────────────────┘  └──────────────────────────────┘   │
│      │                                   │                       │
│      ▼                                   ▼                       │
│  ┌────────────────────────┐  ┌──────────────────────────────┐   │
│  │  /api/storage/[...path]│  │  公开 URL                     │   │
│  │  动态路由访问           │  │  https://xxx.r2.dev/...      │   │
│  └────────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心组件

### 2.1 组件职责矩阵

| 组件 | 文件路径 | 职责 | 依赖 |
|------|----------|------|------|
| **ImageGenerationAgent** | `src/lib/ai/agents/image-generator.ts` | 调用 AI 生成图像、协调存储流程 | storage/index.ts |
| **ImageOptimizer** | `src/lib/image/optimization.ts` | WebP 转换、压缩、缩放、元数据 | - |
| **StorageAdapter** | `src/lib/storage/index.ts` | **Flydrive** 存储适配层 | flydrive, FSDriver, S3Driver |
| **StorageAPI** | `src/app/api/storage/[...path]/route.ts` | 本地图像访问路由 | storage/index.ts |

### 2.2 数据流时序

```
用户请求生成图像
         │
         ▼
┌─────────────────────────────┐
│ 1. ImageGenerationAgent     │
│    - buildImagePrompt()     │
│    - generateWithModel()    │
└─────────────┬───────────────┘
              │ 返回临时 URL 或 Buffer
              ▼
┌─────────────────────────────┐
│ 2. saveImage()              │
│    - fetch() 下载（如为 URL）│
│    - optimizeImage() 优化   │
│    - uploadImage() 存储     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 3. StorageAdapter           │
│    - 读取 STORAGE_MODE      │
│    - 路由到对应存储后端      │
└─────────────┬───────────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
   [local]        [r2]
       │             │
       ▼             ▼
  写入本地文件    上传 R2
       │             │
       ▼             ▼
  返回 /api/...   返回公开 URL
```

---

## 3. 接口规范

### 3.1 StorageProvider 接口

```typescript
/**
 * 存储后端统一接口
 * 所有存储实现必须遵循此接口
 */
interface StorageProvider {
  /**
   * 上传文件
   * @param key - 存储路径（如 covers/platform/uuid.webp）
   * @param body - 文件内容
   * @param contentType - MIME 类型
   * @returns 包含访问 URL 的结果
   */
  upload(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string
  ): Promise<UploadResult>;

  /**
   * 删除文件
   */
  delete(key: string): Promise<void>;

  /**
   * 获取文件
   * @returns 文件内容或 null（不存在时）
   */
  get(key: string): Promise<Buffer | null>;

  /**
   * 检查文件是否存在
   */
  exists(key: string): Promise<boolean>;
}

/**
 * 上传结果
 */
interface UploadResult {
  key: string;      // 存储键
  url: string;      // 访问 URL
  etag?: string;    // ETag（可选）
  size?: number;    // 文件大小（可选）
}
```

### 3.2 存储路径规范

| 段 | 格式 | 说明 |
|------|------|------|
| 前缀 | `covers/` | 固定，标识封面图像 |
| 平台 | `{platformId}/` | xiaohongshu, wechat, douyin 等 |
| 文件名 | `{uuid}.{format}` | UUID v4 + webp/png/jpg |

**示例**:
```
covers/xiaohongshu/550e8400-e29b-41d4-a716-446655440000.webp
covers/wechat/123e4567-e89b-12d3-a456-426614174000.webp
```

---

## 4. 存储后端实现

### 4.1 R2 存储（生产环境）

**文件**: `src/lib/storage/r2.ts`

**配置要求**:
```bash
CLOUDFLARE_R2_ACCESS_KEY=xxx
CLOUDFLARE_R2_SECRET_KEY=xxx
CLOUDFLARE_R2_BUCKET_NAME=xxx
CLOUDFLARE_R2_ACCOUNT_ID=xxx
CLOUDFLARE_R2_PUBLIC_URL=https://xxx.r2.dev
```

**特点**:
- 使用 AWS S3 兼容 API（@aws-sdk/client-s3）
- 零出站流量费用
- 全球 CDN 加速
- 支持公开 URL 直接访问

**返回 URL 格式**:
```
https://{bucket}.r2.dev/{key}
```

> 详细文档: [cloudflare-r2.md](../integrations/cloudflare-r2.md)

### 4.2 本地存储（开发环境）

**文件**: `src/lib/storage/local.ts`（新增）

**配置**:
```bash
STORAGE_MODE=local  # 启用本地存储
```

**存储目录**: `.local-storage/`（项目根目录）

**特点**:
- 零配置即可使用
- 无需云服务依赖
- 开发调试友好
- 文件直接可见

**返回 URL 格式**:
```
/api/storage/{key}
```

**访问路由**: `src/app/api/storage/[...path]/route.ts`

---

## 5. 环境切换机制

### 5.1 环境变量

```bash
# 存储模式
# local - 本地文件存储（开发环境默认）
# r2    - Cloudflare R2（生产环境）
STORAGE_MODE=local
```

### 5.2 切换逻辑

```typescript
// src/lib/storage/index.ts
// 依赖来源：flydrive (生产级库，https://flydrive.dev)

import { Disk } from "flydrive";
import { FSDriver } from "flydrive/drivers/fs";
import { S3Driver } from "flydrive/drivers/s3";

const STORAGE_MODE = process.env.STORAGE_MODE || "local";

export function getStorageDisk(): Disk {
  if (STORAGE_MODE === "r2") {
    return new Disk(new S3Driver({ ... }));
  }
  return new Disk(new FSDriver({ location: ".local-storage" }));
}

export async function uploadImage(key, body, contentType) {
  const disk = getDisk();
  await disk.put(key, body, { contentType });
  return { key, url: await disk.getUrl(key) };
}
```

### 5.3 默认行为

| 场景 | STORAGE_MODE | 行为 |
|------|--------------|------|
| 未设置 | undefined | 使用 **local**（开发友好） |
| 开发环境 | `local` | 存储到 `.local-storage/` |
| 生产环境 | `r2` | 上传到 Cloudflare R2 |

---

## 6. 扩展指南

### 6.1 添加新存储后端

**步骤 1**: 创建实现文件

```typescript
// src/lib/storage/s3.ts

import { UploadResult } from "./types";

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<UploadResult> {
  // S3 上传逻辑
}

export async function deleteFromS3(key: string): Promise<void> {
  // S3 删除逻辑
}

export async function getFromS3(key: string): Promise<Buffer | null> {
  // S3 下载逻辑
}
```

**步骤 2**: 注册到适配层

```typescript
// src/lib/storage/index.ts

import { uploadToS3 } from "./s3";

switch (storageMode) {
  case "s3":
    return uploadToS3(key, body, contentType);
  // ...
}
```

**步骤 3**: 添加环境变量

```bash
# .env.local.example
STORAGE_MODE=s3
AWS_S3_ACCESS_KEY=xxx
AWS_S3_SECRET_KEY=xxx
AWS_S3_BUCKET_NAME=xxx
AWS_S3_REGION=xxx
```

### 6.2 潜在扩展后端

| 后端 | 场景 | 复杂度 |
|------|------|--------|
| AWS S3 | 大规模生产 | 中 |
| 阿里云 OSS | 国内用户 | 中 |
| MinIO | 私有化部署 | 低 |
| Vercel Blob | Vercel 生态 | 低 |
| Supabase Storage | Supabase 生态 | 低 |

---

## 7. 注意事项

### 7.1 Serverless 环境限制

> [!CAUTION]
> **Vercel 等 Serverless 平台无法使用本地存储！**
>
> - `/tmp` 目录仅在单次请求期间存在
> - 每次请求后文件系统重置
> - 生产环境必须使用 R2 或其他云存储

### 7.2 Next.js public/ 目录

> [!WARNING]
> **不能在运行时向 `public/` 写入文件！**
>
> - `public/` 在构建时静态化
> - 运行时添加的文件不会被静态服务器识别
> - 必须使用 API 路由动态返回文件

### 7.3 存储一致性

- 本地存储与云存储的 URL 格式不同
- 前端应使用相对 URL 或完整 URL
- 缓存键应与存储模式无关

---

## 8. 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/storage/index.ts` | ✅ 已实现 | Flydrive 存储适配层 |
| `src/lib/storage/r2.ts` | ⚠️ 保留 | 旧版 R2 直接访问（弃用） |
| `src/app/api/storage/[...path]/route.ts` | ✅ 已实现 | 本地图像访问路由 |
| `src/lib/ai/agents/image-generator.ts` | ✅ 已修改 | 使用 uploadImage() |
| `.env.local.example` | ✅ 已修改 | 添加 STORAGE_MODE |

### 8.2 依赖清单

| 依赖 | 版本 | 用途 |
|------|------|------|
| `flydrive` | latest | 存储抽象核心 |
| `@aws-sdk/client-s3` | ^3.x | S3/R2 客户端 |
| `@aws-sdk/s3-request-presigner` | ^3.x | Signed URL 生成 |

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| 现有存储实现 | `src/lib/storage/r2.ts` |
| 图像生成流程 | `src/lib/ai/agents/image-generator.ts` |
| 图像优化逻辑 | `src/lib/image/optimization.ts` |
| 环境变量配置 | `.env.local.example` |

## 相关链接 Related

- [Cloudflare R2 集成](../integrations/cloudflare-r2.md)
- [图像生成架构](../features/image-generation-architecture.md)
- [架构原则](principles.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 实现完成，使用 Flydrive 库替代自实现存储逻辑 |
| 2025-12-22 | 初版创建，覆盖现有 R2 架构与本地存储扩展设计 |
