# Cloudflare R2 存储集成文档

> 本文档描述 Cover 项目与 Cloudflare R2 存储服务的集成方式。

---

## 目的 Purpose

说明 R2 存储的配置与使用方式。

## 适用范围 Scope

- R2 作为生产环境存储后端
- 与本地存储的切换机制
- 环境配置与验证

## 当前状态 Status

**Active** - 生产环境图像存储依赖

> [!NOTE]
> 自 2025-12-22 起，项目使用 **Flydrive** 库作为存储抽象层。
> R2 存储现为**可选**，开发环境可使用本地存储。

---

## 1. 架构概览

### 1.1 存储适配层架构

```
ImageGenerationAgent
     │
     └──► saveImage()
              │
              ▼
     ┌─────────────────────────┐
     │  Storage Adapter        │
     │  src/lib/storage/index  │
     │  (Flydrive)             │
     └───────────┬─────────────┘
                 │
          STORAGE_MODE
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
   [local]              [r2]
       │                   │
       ▼                   ▼
.local-storage/     Cloudflare R2
       │                   │
       ▼                   ▼
/api/storage/...    公开 URL
```

> **证据来源**: [src/lib/storage/index.ts](file:///d:/C_Projects/Cover/src/lib/storage/index.ts)

---

## 2. 环境配置

### 2.1 存储模式选择

```bash
# 存储模式（必需）
# local - 本地文件存储（开发环境，无需 R2 配置）
# r2    - Cloudflare R2（生产环境）
STORAGE_MODE=r2
```

### 2.2 R2 环境变量（仅 STORAGE_MODE=r2 时需要）

```bash
# Cloudflare R2 Storage
CLOUDFLARE_R2_ACCESS_KEY=your_access_key_here
CLOUDFLARE_R2_SECRET_KEY=your_secret_key_here
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.dev
```

> **证据来源**: [.env.local.example](file:///d:/C_Projects/Cover/.env.local.example)

### 2.3 Cloudflare 配置步骤

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **R2** 页面
3. 创建存储桶 (Bucket)
4. 配置公开访问 (Public Access)
5. 创建 API Token (Access Key + Secret Key)

---

## 3. 接口说明

### 3.1 文件位置

```
src/lib/storage/index.ts  # 存储适配层（推荐使用）
src/lib/storage/r2.ts     # R2 直接访问（已弃用）
```

### 3.2 使用存储适配层（推荐）

```typescript
import { uploadImage, getImage, deleteImage } from "@/lib/storage";

// 上传文件
const result = await uploadImage(
  "covers/2025-12-22/uuid.webp",  // key: 存储路径
  imageBuffer,                    // body: 文件内容
  "image/webp"                    // contentType: MIME 类型
);

// 返回值
{
  key: "covers/2025-12-22/uuid.webp",
  url: "https://your-bucket.r2.dev/covers/2025-12-22/uuid.webp"
}

// 获取文件
const bytes = await getImage("covers/2025-12-22/uuid.webp");

// 删除文件
await deleteImage("covers/2025-12-22/uuid.webp");
```

> **证据来源**: [src/lib/storage/index.ts](file:///d:/C_Projects/Cover/src/lib/storage/index.ts)

### 3.3 依赖说明

存储适配层基于 **Flydrive** 库实现：

| 依赖 | 用途 |
|------|------|
| `flydrive` | 存储抽象核心 |
| `flydrive/drivers/s3` | S3Driver（R2 兼容） |
| `flydrive/drivers/fs` | FSDriver（本地存储） |
| `@aws-sdk/client-s3` | AWS S3 客户端 |

> **来源**: [Flydrive 官方文档](https://flydrive.dev/docs/services/r2)

---

## 4. 返回类型

```typescript
interface UploadResult {
  key: string;   // 存储键（路径）
  url: string;   // 公开访问 URL
  etag?: string; // ETag 标识（可选）
}
```

---

## 5. 存储路径规范

### 5.1 命名规则

```
covers/{platformId}/{uuid}.{ext}
```

| 组成 | 说明 | 示例 |
|------|------|------|
| `covers/` | 固定前缀 | - |
| `{platformId}` | 平台 ID | `xiaohongshu`, `wechat` |
| `{uuid}` | 文件 UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `{ext}` | 文件扩展名 | `webp` |

---

## 6. 错误处理

### 6.1 常见错误

| 错误 | 原因 | 处理方式 |
|------|------|----------|
| `Missing Cloudflare R2 configuration` | 环境变量未配置 | 检查 `.env.local` |
| `AccessDenied` | 密钥权限不足 | 检查 API Token 权限 |
| `NoSuchBucket` | 存储桶不存在 | 确认 BUCKET_NAME 配置 |

---

## 7. 成本说明

### 7.1 R2 定价

| 项目 | 免费额度 | 超出价格 |
|------|----------|----------|
| 存储 | 10 GB/月 | $0.015/GB |
| Class A 操作 (写入) | 1M 次/月 | $4.50/M 次 |
| Class B 操作 (读取) | 10M 次/月 | $0.36/M 次 |
| 出站流量 | 无限 | 免费 |

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| 存储适配层 | `src/lib/storage/index.ts` |
| R2 配置 | `src/lib/storage/index.ts` (createR2Driver) |
| 环境变量 | `.env.local.example` |
| 依赖版本 | `package.json` (flydrive, @aws-sdk/client-s3) |

## 相关链接 Related

- [存储架构](../architecture/storage-architecture.md)
- [本地存储扩展 ADR](../architecture/adr-20251222-local-storage.md)
- [封面生成 API](api-generate.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 重构为 Flydrive 集成，R2 现为可选存储后端 |
| 2025-12-22 | 初版创建，覆盖 R2 配置与接口说明 |
