# Cover 项目文档索引

> AI 封面生成器项目文档中心

---

## 快速导航

### 📖 开发指南 (Guides)

| 文档 | 说明 |
|------|------|
| [快速启动](guides/getting-started.md) | 环境配置、依赖安装、开发服务器启动 |
| [开发工作流](guides/development-workflow.md) | 分支策略、提交规范、质量检查 |
| [设计思想](guides/design-philosophy.md) | KISS、DRY、单一职责等核心编程原则 |

---

### 🔌 集成文档 (Integrations)

| 文档 | 说明 |
|------|------|
| [封面生成 API](integrations/api-generate.md) | POST/GET 接口规格、请求响应格式 |
| [OpenAI 集成](integrations/openai-integration.md) | GPT/DALL-E/Moderation 集成 |
| [Cloudflare R2](integrations/cloudflare-r2.md) | 图像存储服务集成 |

---

### 📋 功能文档 (Features)

| 文档 | 说明 |
|------|------|
| [封面生成 PRD](features/prd-cover-generation.md) | 产品需求、用户故事、验收标准 |
| [封面生成规格](features/spec-cover-generation.md) | 技术实现、Pipeline、Agent |

---

### 🏗️ 架构文档 (Architecture)

| 文档 | 说明 |
|------|------|
| [架构原则](architecture/principles.md) | 分层架构、数据流、模块职责 |
| [ADR: 技术栈选型](architecture/adr-20251222-tech-stack.md) | 框架与服务选型决策记录 |

---

### 📋 规范文档 (Standards)

| 文档 | 说明 |
|------|------|
| [命名规范](standards/naming-conventions.md) | 变量、函数、类、常量的命名规则 |
| [编码规范](standards/coding-style-guide.md) | ESLint/Prettier 配置、架构约束 |
| [文件结构规范](standards/file-structure.md) | 目录结构、文件命名、模块组织 |

---

### 🚨 事故复盘 (Incidents)

| 文档 | 说明 |
|------|------|
| [事故复盘目录](incidents/README.md) | 复盘模板与命名规范 |

---

### 📚 归档参考 (Archive/References)

| 文档 | 说明 | 适用时机 |
|------|------|----------|
| [归档目录](archive/README.md) | 归档规范与结构 | - |
| [微服务](references/microservices.md) | 微服务架构概念 | 未来团队扩大时参考 |
| [Redis](references/redis.md) | 缓存与分布式存储 | 未来引入缓存时参考 |
| [消息队列](references/message-queue.md) | 异步任务处理 | 未来引入队列时参考 |

---

## 其他文档

| 文档 | 说明 |
|------|------|
| [审计报告](audit_report.md) | 项目代码完整性审计报告 |
| [系统架构图](system_architecture.txt) | ASCII 格式架构图 |
| [时序图](sequence_diagram.txt) | ASCII 格式时序图 |

---

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.x
- **AI**: OpenAI GPT-4 / DALL-E 3 / Replicate
- **存储**: Cloudflare R2
- **UI**: Radix UI + Tailwind CSS + Fabric.js

---

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 检查
npm run lint
npm run type-check
npm test
```

---

*最后更新: 2025-12-22*

