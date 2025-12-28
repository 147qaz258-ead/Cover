# 📘 AI 封面生成器 - 项目上下文文档

> **生成时间**：2025-12-22 16:11  
> **对话主题**：本地图像存储功能实现（Flydrive 集成）

---

## 一、项目概要（Project Overview）

| 字段 | 内容 |
|------|------|
| **项目名称** | AI Cover Generator (AI 封面生成器) |
| **项目路径** | `d:\C_Projects\Cover` |
| **项目背景** | 为社交媒体内容创作者提供一键式 AI 封面生成服务，支持多平台（小红书、微信、抖音、B站等 10 个平台） |
| **目标与目的** | 1. 自动分析文本内容生成标题<br>2. 基于标题和平台规格生成高质量封面图<br>3. 提供可视化编辑与导出功能 |
| **要解决的问题** | 1. 开发环境需配置 R2 才能测试（已解决）<br>2. 存储层与 R2 硬耦合（已解决） |
| **整体愿景** | 成为社交媒体内容创作的一站式 AI 封面解决方案 |

---

## 二、范围定义（Scope Definition）

| 字段 | 内容 |
|------|------|
| **当前范围** | 1. 实现存储适配层（Flydrive）<br>2. 支持本地/R2 存储切换<br>3. 更新相关文档 |
| **非本次范围** | 1. 其他存储后端（S3/OSS/MinIO）<br>2. 前端 UI 修改<br>3. 新增 AI 模型 |
| **约束条件** | 1. 采用"胶水开发"模式，优先复用成熟库<br>2. 禁止自行实现存储逻辑，委托给 Flydrive<br>3. 仅编写最小配置与调度代码 |

---

## 三、关键实体与关系（Key Entities & Relationships）

### 3.1 核心实体

| 实体 | 类型 | 职责 |
|------|------|------|
| `ImageGenerationAgent` | AI代理 | 编排图片生成流程，调用 `saveImage()` |
| `StorageAdapter` | 适配层 | 根据 `STORAGE_MODE` 选择存储后端 |
| `Flydrive Disk` | 外部库 | 统一存储 API（`put`, `get`, `delete`, `getUrl`） |
| `FSDriver` | Flydrive 驱动 | 本地文件系统存储 |
| `S3Driver` | Flydrive 驱动 | S3/R2 云存储 |
| `StorageAPI` | API 路由 | 本地图像访问（`/api/storage/[...path]`） |

### 3.2 实体关系

```
ImageGenerationAgent
     │
     └──► saveImage() ──► uploadImage()
                              │
                       ┌──────┴──────┐
                       ▼              ▼
                  Flydrive Disk  Flydrive Disk
                  (FSDriver)     (S3Driver)
                       │              │
                       ▼              ▼
                .local-storage/   Cloudflare R2
                       │              │
                /api/storage/...  公开 URL
```

---

## 四、功能模块拆解（Functional Decomposition）

### 4.1 模块列表

| 模块 | 路径 | 状态 |
|------|------|------|
| Storage Adapter | `src/lib/storage/index.ts` | ✅ 已实现 |
| Storage API | `src/app/api/storage/[...path]/route.ts` | ✅ 已实现 |
| Image Generator | `src/lib/ai/agents/image-generator.ts` | ✅ 已修改 |
| R2 Storage (旧) | `src/lib/storage/r2.ts` | ⚠️ 弃用 |

### 4.2 存储适配层详情

| 字段 | 内容 |
|------|------|
| **输入** | `{ key, body, contentType }` |
| **输出** | `{ key, url }` |
| **核心逻辑** | 1. 读取 `STORAGE_MODE` 环境变量<br>2. 创建对应 Flydrive Driver<br>3. 调用 `disk.put()` 上传<br>4. 调用 `disk.getUrl()` 获取 URL |
| **典型场景** | 开发环境无需配置 R2，设置 `STORAGE_MODE=local` 即可 |

---

## 五、技术方向与关键决策（Technical Direction & Decisions）

### 5.1 技术栈

| 层级 | 技术 |
|------|------|
| **框架** | Next.js 14 (App Router) + TypeScript 5.x |
| **存储抽象** | Flydrive (生产级库) |
| **本地存储** | FSDriver (Flydrive) |
| **云存储** | S3Driver (Flydrive) → Cloudflare R2 |
| **依赖** | `flydrive`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |

### 5.2 已做技术决策

| 决策 | 理由 |
|------|------|
| 使用 Flydrive 替代自实现 | 遵循胶水开发原则，复用生产级库 |
| 删除 `r2.ts` 直接调用 | 由 Flydrive S3Driver 替代 |
| 默认 `STORAGE_MODE=local` | 开发友好，零配置即可运行 |
| 本地存储通过 API 路由访问 | Next.js 无法运行时修改 `public/` |

### 5.3 可替代方案

| 方案 | 场景 | 复杂度 |
|------|------|--------|
| AWS S3 | 大规模生产 | 中 |
| 阿里云 OSS | 国内用户 | 中 |
| MinIO | 私有化部署 | 低 |
| Vercel Blob | Vercel 生态 | 低 |

---

## 六、交互与风格约定（Interaction Conventions）

| 字段 | 内容 |
|------|------|
| **开发模式** | 胶水开发（强依赖复用/生产级库直连） |
| **AI 输出风格** | 结构清晰、层级明确、工程化表达 |
| **代码规范** | 注释中文、标识符英文、ASCII 分块注释 |
| **文档同步** | 架构变更必须更新 CLAUDE.md 及相关文档 |

---

## 七、当前进展总结（Current Status）

### 7.1 已确认事实

- [x] 使用 Flydrive 库实现存储适配层
- [x] 支持 `local` 和 `r2` 两种存储模式
- [x] 开发环境无需配置 R2
- [x] 本地存储图像通过 `/api/storage/...` 访问
- [x] 已更新 6 个相关文档

### 7.2 已完成变更

| 类型 | 文件 |
|------|------|
| 🆕 新建 | `src/lib/storage/index.ts` |
| 🆕 新建 | `src/app/api/storage/[...path]/route.ts` |
| 🆕 新建 | `docs/architecture/adr-20251222-local-storage.md` |
| 🔧 修改 | `src/lib/ai/agents/image-generator.ts` |
| 🔧 修改 | `.env.local.example` |
| 📄 更新 | `cloudflare-r2.md`, `getting-started.md`, `storage-architecture.md`, `PROJECT_CONTEXT.md`, `CLAUDE.md` |

---

## 八、后续计划与风险（Next Steps & Risks）

### 8.1 待讨论主题

1. 是否需要添加其他存储后端（S3/OSS）
2. 本地存储的清理策略
3. 生产环境部署验证

### 8.2 潜在风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Serverless 环境不兼容本地存储 | Vercel 等平台无法使用 local 模式 | 生产环境强制 `STORAGE_MODE=r2` |
| 本地存储磁盘占用 | 大量图像累积 | 定期清理 `.local-storage/` |

### 8.3 推荐的后续初始化 Prompt

```
你正在继续开发 AI 封面生成器项目 (d:\C_Projects\Cover)。

当前状态：
- 存储层已重构为 Flydrive 适配层
- 支持 local/r2 两种模式
- 开发环境默认使用本地存储

可能的后续任务：
1. 验证生产环境 R2 模式正常工作
2. 添加本地存储自动清理功能
3. 扩展其他存储后端
```

---

## 九、关键文件索引

| 文件 | 用途 |
|------|------|
| `src/lib/storage/index.ts` | Flydrive 存储适配层 |
| `src/lib/storage/r2.ts` | 旧版 R2 直接访问（已弃用） |
| `src/app/api/storage/[...path]/route.ts` | 本地图像访问路由 |
| `src/lib/ai/agents/image-generator.ts` | 图片生成代理 |
| `docs/architecture/storage-architecture.md` | 存储架构文档 |
| `docs/integrations/cloudflare-r2.md` | R2 集成文档 |
| `docs/guides/getting-started.md` | 快速启动指南 |

---

*文档结束 · 可用于跨会话复用*
