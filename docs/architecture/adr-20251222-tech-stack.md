# 技术栈决策记录

**ADR-20251222-tech-stack**

---

## 目的 Purpose

记录 Cover 项目技术栈选型的决策过程与理由。

## 适用范围 Scope

- 框架选择
- AI 服务选择
- 存储服务选择

## 当前状态 Status

**Accepted** - 已实施

---

## 1. 上下文

Cover 是一个 AI 封面生成器，核心需求：
- 用户输入文本，30 秒内生成封面
- 支持 10 个社交平台的不同尺寸
- 提供 10 种风格模板
- 前端需要实时进度展示
- 需要图像编辑能力（无限画布）

---

## 2. 决策

### 2.1 框架：Next.js 14 (App Router)

**选择理由**:
- 服务端渲染 + API 路由一体化
- App Router 提供更好的布局与路由组织
- React Server Components 减少客户端 JS
- 与 Vercel 部署无缝集成

**替代方案**:
| 方案 | 优势 | 劣势 | 否决原因 |
|------|------|------|----------|
| Vite + Express | 更轻量 | 需额外维护 API 服务 | 增加运维复杂度 |
| Remix | 更好的数据加载 | 生态较小 | 社区资源不足 |

### 2.2 AI 文本：Google Gemini (Gemini 2.5 Flash)

**选择理由**:
- **成本优势**: Gemini 2.5 Flash 提供了极具竞争力的价格（甚至免费层）。
- **性能**: 响应速度极快，适合实时文本分析和标题生成。
- **多模态**: 原生支持多模态（虽然目前主要用文本）。
- **可用性**: 相比 OpenAI，Google AI 在某些网络环境下更易访问（或通过代理）。

**替代方案**:
| 方案 | 优势 | 劣势 | 否决原因 |
|------|------|------|----------|
| OpenAI GPT-4o | 质量顶级 | 成本较高 | API Key 配置问题导致暂时弃用 |
| Claude 3.5 Sonnet | 代码与逻辑强 | 成本较高 | 暂未集成 |

### 2.3 AI 图像：Laozhang API (Gemini 3 Pro + Flux)

**选择理由**:
- **高性能组合**: 首选 Gemini 3 Pro (Laozhang 转接) 速度快；备选 Flux (Laozhang 转接) 质量高。
- **稳定性**: 通过 Laozhang API 中转，规避了 Google 官方免费版的 429 速率限制。
- **Fallback 机制**: 自动降级策略保证了高可用性。

**替代方案**:
| 方案 | 优势 | 劣势 | 否决原因 |
|------|------|------|----------|
| 纯 Google 官方 API | 免费 | 严重的 Rate Limit | 用户体验极差 (需等待) |
| OpenAI DALL-E 3 | 语义理解好 | 成本较高 | 作为次级备选 |

### 2.4 存储：Cloudflare R2

**选择理由**:
- S3 兼容 API，迁移成本低
- 出站流量免费
- 全球边缘节点，访问速度快
- 成本低于 AWS S3

**替代方案**:
| 方案 | 优势 | 劣势 | 否决原因 |
|------|------|------|----------|
| AWS S3 | 生态成熟 | 出站流量贵 | 成本考量 |
| Supabase Storage | 集成数据库 | 功能较简单 | 作为备选 |

### 2.5 校验：Zod

**选择理由**:
- TypeScript 原生集成
- 运行时类型校验
- Schema 可复用于前后端

### 2.6 画布：Fabric.js 6.x

**选择理由**:
- 功能完善的 Canvas 封装
- 支持对象选择、拖拽、缩放
- 社区活跃，文档完善

---

## 3. 后果

### 3.1 正面影响

- 技术栈统一，学习成本低
- 单仓库管理，无微服务运维
- AI 服务按需付费，初期成本可控

### 3.2 负面影响

- 强依赖外部 AI 服务（需做降级方案）
- Next.js 版本升级可能有 breaking changes
- R2 在中国大陆访问需优化

### 3.3 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| OpenAI 服务不可用 | 保留 Gemini 作为备选文本模型 |
| DALL-E 限流 | 使用 Replicate 作为备选图像模型 |
| R2 访问慢 | 考虑 CDN 或国内存储备份 |

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| 依赖版本 | `package.json` |
| 框架配置 | `next.config.js`, `tsconfig.json` |
| 存储配置 | `src/lib/storage/r2.ts` |
| AI 配置 | `src/lib/ai/providers/*.ts` |

## 相关链接 Related

- [架构原则](principles.md)
- [Google Gemini 集成](../integrations/gemini-image-generation.md)
- [Cloudflare R2 集成](../integrations/cloudflare-r2.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 初版创建，记录技术栈选型决策 |
