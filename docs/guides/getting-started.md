# 快速启动指南

> 本文档指导如何从零开始运行 Cover 项目。

---

## 目的 Purpose

帮助新成员在 10 分钟内完成环境配置并成功启动开发服务器。

## 适用范围 Scope

- 本地开发环境搭建
- 环境变量配置
- 开发服务器启动与验证

## 当前状态 Status

**Active** - 适用于 Cover v0.1.0

---

## 1. 前置条件

### 1.1 系统要求

| 工具 | 版本要求 | 验证命令 |
|------|----------|----------|
| Node.js | >= 18.x | `node -v` |
| npm | >= 9.x | `npm -v` |
| Git | >= 2.x | `git -v` |

### 1.2 API 密钥

| 服务 | 必需性 | 获取方式 |
|------|--------|----------|
| OpenAI API | ✅ 至少一个 AI 服务 | [platform.openai.com](https://platform.openai.com/api-keys) |
| Google AI API | 可选 | [aistudio.google.com](https://aistudio.google.com) |
| Replicate API | 可选 | [replicate.com/account](https://replicate.com/account) |
| Cloudflare R2 | ⚠️ 仅生产环境 | [Cloudflare Dashboard](https://dash.cloudflare.com) |

> [!TIP]
> **开发环境无需配置 R2！** 设置 `STORAGE_MODE=local` 即可使用本地存储。

---

## 2. 安装步骤

### 2.1 克隆仓库

```bash
git clone <repository-url>
cd Cover
```

### 2.2 安装依赖

```bash
npm install
```

> **证据来源**: [package.json](file:///d:/C_Projects/Cover/package.json)

### 2.3 配置环境变量

1. 复制环境变量模板：

```bash
cp .env.local.example .env.local
```

2. 编辑 `.env.local`，填入密钥：

```bash
# ==================== 存储配置（必需）====================
# local = 本地存储（开发环境，无需 R2 配置）
# r2 = Cloudflare R2（生产环境）
STORAGE_MODE=local

# ==================== AI Provider（至少配置一个）====================
OPENAI_API_KEY=sk-xxx...                    # OpenAI API 密钥
GOOGLE_AI_API_KEY=xxx...                    # Google AI API（推荐）

# ==================== Cloudflare R2（仅生产环境）====================
# 当 STORAGE_MODE=r2 时需要配置
# CLOUDFLARE_R2_ACCESS_KEY=your_access_key
# CLOUDFLARE_R2_SECRET_KEY=your_secret_key
# CLOUDFLARE_R2_BUCKET_NAME=your_bucket
# CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
# CLOUDFLARE_R2_PUBLIC_URL=https://xxx.r2.dev

# ==================== App Settings ====================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AI Cover Generator
```

> **证据来源**: [.env.local.example](file:///d:/C_Projects/Cover/.env.local.example)

---

## 3. 启动开发服务器

```bash
npm run dev
```

**预期输出**:
```
> ai-cover-generator@0.1.0 dev
> next dev

  ▲ Next.js 14.2.15
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in XXXms
```

### 3.1 访问应用

打开浏览器访问: **http://localhost:3000**

### 3.2 验证功能

1. 进入 `/generate` 页面
2. 输入测试文本（至少 10 个字符）
3. 选择平台和风格模板
4. 点击生成按钮
5. 等待生成完成

> [!NOTE]
> 使用本地存储时，生成的图像保存在项目根目录的 `.local-storage/` 文件夹中。

---

## 4. 常用命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run type-check` | 运行 TypeScript 类型检查 |

> **证据来源**: [package.json](file:///d:/C_Projects/Cover/package.json) 第 5-11 行

---

## 5. 常见问题

### 5.1 端口 3000 被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 或使用其他端口
npm run dev -- -p 3001
```

### 5.2 环境变量未生效

1. 确认 `.env.local` 文件存在于项目根目录
2. 重启开发服务器（Ctrl+C 后重新 `npm run dev`）
3. 检查变量名是否正确（区分大小写）

### 5.3 OpenAI API 调用失败

- 检查 `OPENAI_API_KEY` 是否正确
- 确认 API 密钥有足够配额
- 检查网络是否能访问 api.openai.com

### 5.4 本地存储图像无法访问

- 确认 `STORAGE_MODE=local`
- 检查 `.local-storage/` 目录是否生成
- 访问 `http://localhost:3000/api/storage/covers/...` 验证

### 5.5 R2 上传失败（生产环境）

- 确认 `STORAGE_MODE=r2`
- 确认 Cloudflare R2 存储桶已创建
- 检查 Access Key 和 Secret Key 权限
- 确认 `CLOUDFLARE_R2_PUBLIC_URL` 配置正确

### 5.6 API 生成失败 (500 错误)

如果点击「开始生成」后出现 500 错误：

1. **检查 AI API Key 配置**
   ```bash
   # 确认至少配置了一个 AI 服务密钥
   type .env.local | findstr "API_KEY"
   ```

2. **查看终端错误日志**
   - 开发服务器终端会显示详细错误堆栈
   - 搜索关键词：`error`, `failed`, `API key not configured`

3. **验证存储目录**
   ```bash
   # 确认本地存储目录存在
   dir .local-storage
   ```

4. **常见根因**
   - `GOOGLE_AI_API_KEY` 或 `LAOZHANG_API_KEY` 未配置
   - API Key 无效或已过期
   - 网络无法访问 AI 服务端点

> 📋 详细分析：[/api/generate 500 错误报告](../incidents/2025-12-22-api-generate-500-error.md)

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| 项目名称与版本 | `package.json` |
| 环境变量配置 | `.env.local.example` |
| 存储适配层 | `src/lib/storage/index.ts` |
| 命令脚本 | `package.json` scripts |

## 相关链接 Related

- [开发工作流](development-workflow.md)
- [存储架构](../architecture/storage-architecture.md)
- [Cloudflare R2 集成](../integrations/cloudflare-r2.md)
- [架构原则](../architecture/principles.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 更新存储配置，R2 现为可选（开发环境使用本地存储） |
| 2025-12-22 | 初版创建，覆盖环境配置与启动流程 |
