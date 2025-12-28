# Flydrive 官方文档（离线版）

> 来源: [flydrive.dev](https://flydrive.dev/docs/introduction)  
> 下载时间: 2025-12-22

---

## 目录

1. [简介 Introduction](#1-简介-introduction)
2. [快速开始 Getting Started](#2-快速开始-getting-started)
3. [核心概念 Key Concepts](#3-核心概念-key-concepts)
4. [Disk API](#4-disk-api)
5. [驱动: 本地文件系统 FS Driver](#5-驱动-本地文件系统-fs-driver)
6. [驱动: Cloudflare R2](#6-驱动-cloudflare-r2)
7. [驱动: AWS S3](#7-驱动-aws-s3)

---

## 1. 简介 Introduction

FlyDrive 是一个用于 Node.js 的文件存储库。它提供统一的 API 来与本地文件系统和云存储解决方案（如 S3、R2 和 GCS）进行交互。

**核心目标**: 在没有供应商锁定的情况下读写用户上传的文件。例如，在开发期间你可以将文件存储在本地文件系统中，在生产环境中切换到 S3。

**切换驱动只需简单的配置更改，无需修改应用程序的核心逻辑。**

### 官方驱动

| 驱动 | 说明 |
|------|------|
| **S3Driver** | 支持 AWS S3、Cloudflare R2、Digital Ocean Spaces |
| **GCSDriver** | Google Cloud Storage |
| **FSDriver** | 本地文件系统，使用 Node.js fs 模块 |

### 为什么使用 FlyDrive?

- ✅ 统一 API 支持多种存储服务
- ✅ 可扩展 API，支持自定义存储驱动
- ✅ 统一的异常处理
- ✅ 内置安全原语，防止路径遍历攻击

### 限制

- ❌ 不能创建符号链接
- ❌ 不能监听文件系统或分配 Unix 权限
- ❌ 目录被视为二等公民（云存储基于键值）

---

## 2. 快速开始 Getting Started

### 安装

```bash
npm i flydrive
# 或
yarn add flydrive
# 或
pnpm add flydrive
```

> ⚠️ FlyDrive 是 **ESM-only** 包，不支持 CommonJS

### 基本用法

```typescript
import { Disk } from 'flydrive'
import { FSDriver } from 'flydrive/drivers/fs'

const fsDriver = new FSDriver({
  location: new URL('./uploads', import.meta.url),
  visibility: 'public',
})

const disk = new Disk(fsDriver)
```

### CRUD 操作

```typescript
const key = 'hello.txt'
const contents = 'Hello world'

// 创建文件
await disk.put(key, contents)

// 读取文件（多种方式）
const text = await disk.get(key)           // UTF-8 字符串
const stream = await disk.getStream(key)   // Readable stream
const buffer = await disk.getBytes(key)    // Uint8Array

// 删除文件
await disk.delete(key)
```

### 多驱动切换

```typescript
import { Disk } from 'flydrive'
import { FSDriver } from 'flydrive/drivers/fs'
import { S3Driver } from 'flydrive/drivers/s3'

// 定义驱动集合
const drivers = {
  fs: () => new FSDriver({
    location: new URL('./uploads', import.meta.url),
    visibility: 'public',
  }),
  s3: () => new S3Driver({
    region: 'us-east-1',
    bucket: 'my-bucket',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    visibility: 'public',
  }),
}

// 根据环境变量选择驱动
const driverToUse = drivers[process.env.DRIVE_DISK as keyof typeof drivers]
export const disk = new Disk(driverToUse())
```

运行应用：

```bash
# 开发环境
DRIVE_DISK=fs node server.js

# 生产环境
DRIVE_DISK=s3 node server.js
```

---

## 3. 核心概念 Key Concepts

### 键（Keys）而非路径

云存储（S3/GCS）没有文件路径或目录结构的概念，它们使用**键（keys）**。键可以看起来像路径（如 `profile_photos/user_1.jpg`），但不会被解析为文件系统路径。

```typescript
// ❌ 这会抛出异常
await disk.put('../../user_1.jpg', contents)

// ✅ 正确用法
await disk.put('profile_photos/user_1.jpg', contents)
```

### 键规范化

FlyDrive 会对键进行以下处理：
- 验证字符集
- 防止路径遍历攻击
- 规范化处理

### 统一异常处理

```typescript
import { errors } from 'flydrive'

try {
  await disk.get(key)
} catch (error) {
  if (error instanceof errors.E_CANNOT_READ_FILE) {
    console.error('Unable to read file:', error.cause?.message)
  }
}
```

### 文件可见性

| 值 | 说明 |
|------|------|
| `public` | 文件可通过公开 URL 访问 |
| `private` | 需要签名 URL 或通过应用读取 |

### 目录作为二等公民

云存储没有目录概念，但支持：
- 使用前缀列出文件
- 删除匹配前缀的所有文件

---

## 4. Disk API

### 写入方法

#### `disk.put(key, contents, options?)`

创建或更新文件。

```typescript
await disk.put('hello.txt', 'hello world')
await disk.put('image.png', buffer, { contentType: 'image/png' })
```

**参数**:
- `key`: string - 存储键
- `contents`: string | Uint8Array - 文件内容
- `options?`: WriteOptions - 可选配置

#### `disk.putStream(key, readable, options?)`

从 Readable stream 写入文件。

```typescript
import { createReadStream } from 'node:fs'

const readable = createReadStream('./some-file.txt')
await disk.putStream('hello.txt', readable)
```

### 读取方法

#### `disk.get(key)`

读取文件内容为 UTF-8 字符串。

```typescript
const contents = await disk.get('hello.txt')
```

#### `disk.getStream(key)`

读取文件内容为 Readable stream。

```typescript
const readable = await disk.getStream('hello.txt')
```

#### `disk.getBytes(key)`

读取文件内容为 Uint8Array。

```typescript
const buffer = await disk.getBytes('hello.txt')
```

### 删除方法

#### `disk.delete(key)`

删除单个文件（不存在时不抛错）。

```typescript
await disk.delete('hello.txt')
```

#### `disk.deleteAll(prefix)`

删除匹配前缀的所有文件。

```typescript
await disk.deleteAll('uploads/users/1')
```

### 复制/移动方法

#### `disk.copy(source, destination, options?)`

在同一存储桶内复制文件。

```typescript
await disk.copy('uploads/user_1.jpg', 'uploads/avatars/user_1.jpg')
```

#### `disk.move(source, destination, options?)`

在同一存储桶内移动文件。

```typescript
await disk.move('uploads/user_1.jpg', 'uploads/avatars/user_1.jpg')
```

#### `disk.copyFromFs(source, destination, options?)`

从本地文件系统复制到存储。

```typescript
const source = new URL('./invoice.pdf', import.meta.url)
await disk.copyFromFs(source, 'clients/1/invoice.pdf')
```

### 元数据方法

#### `disk.getMetaData(key)`

获取文件元数据。

```typescript
const metaData = await disk.getMetaData('users/1/avatar.png')
// { contentType, contentLength, etag, lastModified }
```

#### `disk.exists(key)`

检查文件是否存在。

```typescript
if (await disk.exists('hello.txt')) {
  // 文件存在
}
```

### URL 方法

#### `disk.getUrl(key)`

获取文件的公开 URL。

```typescript
const url = await disk.getUrl('hello.txt')
```

> ⚠️ 不检查文件是否存在或是否公开

#### `disk.getSignedUrl(key, options)`

获取临时签名 URL（用于私有文件）。

```typescript
const signedUrl = await disk.getSignedUrl('invoice.pdf', {
  expiresIn: '30 mins',
})
```

**选项**:
- `expiresIn`: string | number - 过期时间
- `contentType`: string - Content-Type
- `contentDisposition`: string - Content-Disposition

---

## 5. 驱动: 本地文件系统 FS Driver

使用 Node.js `fs` 模块在本地文件系统存储文件。

### 基本配置

```typescript
import { Disk } from 'flydrive'
import { FSDriver } from 'flydrive/drivers/fs'

const disk = new Disk(
  new FSDriver({
    location: new URL('./uploads', import.meta.url),
  })
)
```

**配置选项**:
- `location`: URL | string - 存储根目录（必需）
- `visibility`: 'public' | 'private' - 对 FS 驱动无实际影响

### URL Builder

FS 驱动**默认不支持** `disk.getUrl()` 和 `disk.getSignedUrl()`，需要自定义实现：

```typescript
import { SignedURLOptions } from 'flydrive/types'

const disk = new Disk(
  new FSDriver({
    location: new URL('./uploads', import.meta.url),
    urlBuilder: {
      generateURL(key: string, filePath: string) {
        return `https://yourapp.com/uploads/${key}`
      },
      generateSignedURL(key: string, filePath: string, options: SignedURLOptions) {
        // 自定义签名 URL 逻辑
        return `https://yourapp.com/uploads/${key}`
      },
    },
  })
)
```

---

## 6. 驱动: Cloudflare R2

Cloudflare R2 是 S3 兼容的存储服务，使用 S3Driver。

### 依赖安装

```bash
npm i @aws-sdk/s3-request-presigner @aws-sdk/client-s3
```

### 基本配置

```typescript
import { Disk } from 'flydrive'
import { S3Driver } from 'flydrive/drivers/s3'

const disk = new Disk(
  new S3Driver({
    credentials: {
      accessKeyId: 'R2_KEY',
      secretAccessKey: 'R2_SECRET',
    },
    endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
    region: 'auto',          // R2 必须设为 'auto'
    supportsACL: false,      // R2 不支持 ACL
    bucket: 'R2_BUCKET',
    visibility: 'private',
  })
)
```

### R2 必需配置

| 选项 | 说明 |
|------|------|
| `supportsACL: false` | R2 不支持 ACL |
| `endpoint` | 不包含 bucket 名称 |
| `region: 'auto'` | 必须设为 'auto' |
| `bucket` | R2 存储桶名称 |

### 生成公开 URL

需要配置 `cdnUrl`：

```typescript
const disk = new Disk(
  new S3Driver({
    cdnUrl: 'https://pub-xxx.r2.dev',
    endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
    bucket: 'my-bucket',
  })
)

const url = await disk.getUrl('avatar.png')
// https://pub-xxx.r2.dev/avatar.png
```

### 生成签名 URL

```typescript
const signedUrl = await disk.getSignedUrl('invoice.pdf', {
  expiresIn: '30mins',
  contentType: 'application/pdf',
  contentDisposition: 'attachment',
})
```

### 常见问题

1. **使用 S3 兼容凭证** - 生成 R2 token 时选择 S3 兼容凭证
2. **Endpoint 不包含 bucket 名称** - 从 R2 面板复制时需移除 bucket
3. **配置 cdnUrl** - R2 桶默认私有，需配置公开域名

---

## 7. 驱动: AWS S3

### 依赖安装

```bash
npm i @aws-sdk/s3-request-presigner @aws-sdk/client-s3
```

### 基本配置

```typescript
import { Disk } from 'flydrive'
import { S3Driver } from 'flydrive/drivers/s3'

const disk = new Disk(
  new S3Driver({
    credentials: {
      accessKeyId: 'AWS_ACCESS_KEY_ID',
      secretAccessKey: 'AWS_SECRET_ACCESS_KEY',
    },
    region: 'us-east-1',
    bucket: 'my-bucket',
    visibility: 'private',
  })
)
```

### 配置选项

| 选项 | 说明 |
|------|------|
| `bucket` | S3 存储桶名称（必需） |
| `visibility` | 'public' → ACL='public-read'，'private' → ACL='private' |
| `supportsACL` | 是否支持 ACL（R2 需设为 false） |
| `cdnUrl` | CDN URL（如 CloudFront） |
| `urlBuilder` | 自定义 URL 生成器 |
| `encryption` | ServerSideEncryption 选项 |

### 使用现有 S3Client

```typescript
import { S3Driver } from 'flydrive/drivers/s3'
import { S3Client } from '@aws-sdk/client-s3'

const client = new S3Client({})

const driver = new S3Driver({
  client: client,
  bucket: 'my-bucket',
  visibility: 'private',
})
```

### 生成公开 URL

```typescript
// 使用 CDN URL
const disk = new Disk(
  new S3Driver({
    cdnUrl: 'https://xxx.cloudfront.net',
    bucket: 'my-bucket',
  })
)

const url = await disk.getUrl('avatar.png')
// https://xxx.cloudfront.net/avatar.png

// 无 CDN 时回退到 S3 URL
// https://my-bucket.s3.amazonaws.com/avatar.png
```

### 自定义 URL Builder

```typescript
const disk = new Disk(
  new S3Driver({
    bucket: 'my-bucket',
    urlBuilder: {
      async generateURL(key, bucket, s3Client) {
        return `https://custom-url/files/${bucket}/${key}`
      },
    },
  })
)
```

---

## 附录: 类型定义

```typescript
interface WriteOptions {
  contentType?: string
  contentLength?: number
  contentEncoding?: string
  contentDisposition?: string
  cacheControl?: string
  visibility?: 'public' | 'private'
}

interface SignedURLOptions {
  expiresIn: string | number
  contentType?: string
  contentDisposition?: string
}

interface ObjectMetaData {
  contentType: string
  contentLength: number
  etag: string
  lastModified: Date
}
```

---

*文档结束 · 来源 flydrive.dev*
