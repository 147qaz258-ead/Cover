# 📘 项目上下文文档（Project Context Document）

> **生成时间**：2025-12-22 23:59  
> **会话主题**：AI 封面生成器图像生成模块故障诊断与修复

---

## 一、项目概要（Project Overview）

| 字段 | 内容 |
|------|------|
| **项目名称** | Cover (AI Cover Generator / ConnectMachine) |
| **项目背景** | 为社交媒体创作者提供一键式 AI 封面生成服务，支持多平台（小红书、微信、抖音等） |
| **目标与目的** | 通过 AI 智能分析文本内容并生成匹配的视觉封面图像 |
| **要解决的问题** | 本次会话：修复图像生成模块 `Failed to parse URL from ` 错误 |
| **整体愿景** | 让内容创作者零门槛获得专业级封面设计 |

---

## 二、范围定义（Scope Definition）

| 字段 | 内容 |
|------|------|
| **当前范围** | `ImageGenerationAgent` 模块的错误处理与防御性编程修复 |
| **非本次范围** | 前端 UI、其他 Agent（TextAnalyzer、TitleGenerator）、存储层 |
| **约束条件** | 需兼容现有 Provider 架构（OpenAI-Compatible、Gemini、Replicate） |

---

## 三、关键实体与关系（Key Entities & Relationships）

### 核心实体

| 实体名称 | 职责说明 |
|----------|----------|
| `CoverGenerationPipeline` | 编排整个封面生成流程（文本分析 → 标题生成 → 图像生成） |
| `ImageGenerationAgent` | 调用 AI 模型生成图像，处理重试与降级逻辑 |
| `generateWithModel` | 根据 Provider 类型调用对应的图像生成 API |
| `saveImage` | 下载/接收图像数据，优化后上传至存储 |
| Provider（Replicate/Gemini/OpenAI-Compatible） | 外部 AI 图像生成服务 |

### 实体关系描述

```
CoverPipeline
     │
     ▼
ImageGenerationAgent.generateImage()
     │
     ├──► generateWithFallback() ──► generateWithModel()
     │                                      │
     │                                      ▼
     │                               [Provider API Call]
     │                                      │
     └──► saveImage() ◄────────────────────┘
                │
                ▼
           [Storage Layer]
```

---

## 四、功能模块拆解（Functional Decomposition）

### 本次涉及模块

| 模块名称 | 输入 | 输出 | 核心逻辑 |
|----------|------|------|----------|
| `generateWithModel` | prompt, config, request | imageUrl \| Buffer | 根据 config.provider 路由到对应 API |
| `saveImage` | imageData (URL/Buffer) | 持久化存储 URL | 下载 → 优化 → 上传 |

### 典型用户场景

1. 用户输入文本 → 分析 → 生成标题 → 调用图像 API → 保存 → 返回封面 URL

---

## 五、技术方向与关键决策（Technical Direction & Decisions）

| 维度 | 内容 |
|------|------|
| **客户端** | Next.js App Router (RSC) |
| **服务端** | Node.js Runtime, API Routes |
| **模型/算法层** | Replicate (Flux), Gemini Imagen 3, OpenAI-Compatible (Laozhang API) |
| **数据流与架构** | Pipeline 编排 → Agent 执行 → Provider 调用 → Storage 持久化 |

### 已做技术决策

1. 使用 `CoverGenerationPipeline` 统一编排多 Agent
2. 支持 Provider 降级链（Laozhang → Flux → Gemini）
3. 图像统一优化为 WebP 格式后上传

### 可替代方案

- 暂无信息

---

## 六、交互、风格与输出约定（Interaction & Style Conventions）

| 字段 | 内容 |
|------|------|
| **AI 输出风格** | 结构清晰、层级明确、工程化表达 |
| **表达规范** | 统一使用 Markdown；必要时使用伪代码或列表 |
| **格式要求** | 严谨、有序、模块化、可迁移 |
| **用户特殊偏好** | 中文注释与文档，英文变量名；遵循项目级 `CLAUDE.md` 规范 |

---

## 七、当前进展总结（Current Status）

### ✅ 已确认事实

| # | 事实 |
|---|------|
| 1 | 错误根因：Replicate Provider 返回空结果时，代码使用 `\|\| ""` 静默处理，导致空字符串传入 `fetch()` |
| 2 | 修复点 1：`generateWithModel` Line 253-256，改为抛出 `Error("Replicate provider returned no images")` |
| 3 | 修复点 2：`saveImage` Line 335-344，增加 URL 非空与格式校验 |
| 4 | TypeScript 编译通过 (`npx tsc --noEmit --skipLibCheck`) |

### ❓ 未解决问题

| # | 问题 |
|---|------|
| 1 | 尚未进行端到端集成测试验证修复效果 |
| 2 | 未添加单元测试覆盖新增校验逻辑 |

---

## 八、后续计划与风险（Next Steps & Risks）

### 待讨论主题

1. 是否需要为 `ImageGenerationAgent` 添加单元测试？
2. 是否需要监控/告警机制捕获 Provider 失败率？

### 潜在风险与不确定性

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Provider 频繁失败 | 用户体验下降 | 已有重试 + 降级机制 |
| 新校验逻辑误判合法 URL（极低概率） | 正常请求被拒绝 | URL 构造器校验为标准实现，风险极低 |

### 推荐的后续初始化 Prompt

```
你正在继续开发 Cover (AI 封面生成器) 项目。
上次会话修复了 ImageGenerationAgent 的 URL 解析错误。
当前待办：
1. 添加单元测试覆盖空结果场景
2. 进行端到端生成测试验证修复
相关文件：src/lib/ai/agents/image-generator.ts
```

---

## 九、本次修改文件清单

| 文件 | 变更摘要 |
|------|----------|
| [image-generator.ts](file:///d:/C_Projects/Cover/src/lib/ai/agents/image-generator.ts) | 添加空结果校验 + URL 格式校验 |
| [bugfix_plan/fix_01_overview.md](file:///d:/C_Projects/Cover/bugfix_plan/fix_01_overview.md) | 故障综述与根因分析 |
| [bugfix_plan/fix_02_diagnosis.md](file:///d:/C_Projects/Cover/bugfix_plan/fix_02_diagnosis.md) | 模块诊断 |
| [bugfix_plan/fix_03_fix.md](file:///d:/C_Projects/Cover/bugfix_plan/fix_03_fix.md) | 代码修正步骤 |
| [bugfix_plan/fix_04_verify.md](file:///d:/C_Projects/Cover/bugfix_plan/fix_04_verify.md) | 验证方案 |

---

*文档生成完毕，可直接用于跨会话上下文注入。*
