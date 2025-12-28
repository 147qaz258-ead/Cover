# Cover 项目文件结构规范

> 本文档基于项目实际目录结构提取，确保与代码库一致。

---

## 1. 项目根目录结构

```
d:\C_Projects\Cover\
├── .claude/              # Claude AI 配置
├── .eslintrc.json        # ESLint 配置
├── .gitignore            # Git 忽略规则
├── .prettierrc           # Prettier 配置
├── .prettierignore       # Prettier 忽略规则
├── CLAUDE.md             # 项目架构约束条款
├── components.json       # shadcn/ui 组件配置
├── next.config.js        # Next.js 配置
├── next-env.d.ts         # Next.js 类型声明
├── package.json          # 依赖与脚本
├── package-lock.json     # 依赖锁定
├── postcss.config.js     # PostCSS 配置
├── tailwind.config.ts    # Tailwind CSS 配置
├── tsconfig.json         # TypeScript 配置
│
├── docs/                 # 项目文档
├── specs/                # 功能规格说明
├── src/                  # 源代码
└── tests/                # 测试用例
```

---

## 2. src/ 目录结构

```
src/
├── app/                  # Next.js App Router 路由
│   ├── (dashboard)/      # 带布局的路由组
│   │   └── generate/     # /generate 页面
│   ├── api/              # API 路由
│   │   ├── generate/     # 生成接口
│   │   ├── errors/       # 错误处理
│   │   └── moderate/     # 内容审核
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页
│
├── components/           # React 组件
│   ├── app/              # 应用级组件
│   ├── covers/           # 封面业务组件 (7 个)
│   ├── forms/            # 表单组件 (3 个)
│   ├── layout/           # 布局组件
│   └── ui/               # 通用 UI 组件 (17 个)
│
├── data/                 # 静态配置数据
│   └── templates/        # 风格模板配置
│
├── hooks/                # 自定义 React Hooks
│   ├── use-responsive.ts
│   └── ...
│
├── lib/                  # 业务逻辑与工具库
│   ├── ai/               # AI 相关模块
│   │   ├── agents/       # AI 代理 (3 个)
│   │   ├── pipeline/     # 流程管道
│   │   └── providers/    # AI 提供商适配 (4 个)
│   ├── api/              # API 工具
│   ├── canvas/           # 画布工具
│   ├── errors/           # 错误处理
│   ├── middleware/       # 中间件
│   ├── moderation/       # 内容审核
│   ├── platforms/        # 平台配置
│   ├── rate-limiting/    # 限流
│   ├── storage/          # 存储服务
│   ├── templates/        # 模板相关
│   ├── utils/            # 通用工具
│   └── validation/       # 校验 Schema
│
├── middleware/           # Next.js 中间件
│
└── types/                # TypeScript 类型定义
    └── index.ts          # 核心类型导出
```

---

## 3. 目录职责说明

### 3.1 页面与路由 (src/app/)

| 目录/文件 | 职责 |
|-----------|------|
| `(dashboard)/` | 路由组，共享布局但不影响 URL |
| `api/` | API Route Handlers |
| `globals.css` | 全局 CSS 样式 |
| `layout.tsx` | 根布局组件 |
| `page.tsx` | 首页 |

**命名规则**:
- 路由目录使用 kebab-case
- 页面文件固定为 `page.tsx`
- 布局文件固定为 `layout.tsx`
- API 路由文件固定为 `route.ts`

### 3.2 组件 (src/components/)

| 目录 | 职责 | 示例文件 |
|------|------|----------|
| `covers/` | 封面业务逻辑组件 | `cover-generator.tsx`, `cover-gallery.tsx` |
| `forms/` | 表单输入组件 | `text-input.tsx`, `platform-selector.tsx` |
| `ui/` | 通用 UI 原子组件 | `button.tsx`, `card.tsx`, `dialog.tsx` |
| `layout/` | 布局结构组件 | `header.tsx` |
| `app/` | 应用级复合组件 | `error-boundary.tsx` |

**命名规则**:
- 文件名使用 kebab-case: `cover-generator.tsx`
- 导出组件使用 PascalCase: `export function CoverGenerator()`

### 3.3 业务逻辑库 (src/lib/)

| 目录 | 职责 |
|------|------|
| `ai/agents/` | AI 任务代理，封装 prompt 构建与响应解析 |
| `ai/pipeline/` | 流程编排，协调多个 Agent |
| `ai/providers/` | 外部 AI API 适配层 |
| `middleware/` | HTTP 请求中间件 |
| `moderation/` | 内容审核服务 |
| `platforms/` | 平台配置常量 |
| `storage/` | 云存储服务 |
| `utils/` | 通用工具函数 |
| `validation/` | Zod Schema 定义 |

**命名规则**:
- 目录使用 kebab-case
- 文件使用 kebab-case
- 类使用 PascalCase
- 单例使用 camelCase 导出

### 3.4 类型定义 (src/types/)

| 文件 | 职责 |
|------|------|
| `index.ts` | 核心业务类型导出 |

**规则**:
- 所有共享类型定义在 `src/types/index.ts`
- 使用 `export interface` 定义接口
- 使用 `@/types` 路径别名导入

---

## 4. 文件命名规范

### 4.1 通用规则

| 类型 | 规则 | 示例 |
|------|------|------|
| TypeScript 文件 | kebab-case | `cover-pipeline.ts` |
| React 组件 | kebab-case | `cover-generator.tsx` |
| 测试文件 | `*.test.ts` / `*.spec.ts` | `cover-pipeline.test.ts` |
| 类型声明 | `*.d.ts` | `next-env.d.ts` |
| 配置文件 | 点前缀或标准名称 | `.eslintrc.json`, `tailwind.config.ts` |

### 4.2 禁止使用

| 禁止 | 原因 |
|------|------|
| 空格 | 跨平台兼容性问题 |
| 大写字母开头 | 与组件导出混淆 |
| 特殊字符 | 路径解析问题 |
| 中文文件名 | 编码兼容性问题 |

---

## 5. 模块入口规范

### 5.1 index.ts 导出模式

```typescript
// src/lib/ai/providers/index.ts
import { getOpenAIProvider } from "./openai";
import { getGeminiProvider } from "./gemini";
import { getReplicateProvider } from "./replicate";

export { getOpenAIProvider, getGeminiProvider, getReplicateProvider };
export const AI_PROVIDERS = [...];
```

**规则**:
- 每个功能目录应有 `index.ts` 统一导出
- 使用 `@/*` 路径别名从 index 导入

### 5.2 导入路径

```typescript
// ✅ 正确 - 使用路径别名
import { Platform } from "@/types";
import { coverPipeline } from "@/lib/ai/pipeline";

// ❌ 错误 - 使用相对路径
import { Platform } from "../../../types";
```

---

## 6. 新增文件检查清单

创建新文件时，确认以下事项：

- [ ] 文件名符合 kebab-case 规范
- [ ] 放置在正确的目录层级
- [ ] 在 `index.ts` 中导出（如适用）
- [ ] 有对应的类型定义
- [ ] 导入路径使用 `@/*` 别名
- [ ] 无未使用的导入

---

## 7. docs/ 目录结构

```
docs/
├── README.md                    # 文档索引
├── 文档.md                      # 原始规划
├── audit_report.md              # 审计报告
├── system_architecture.txt      # 系统架构图
├── sequence_diagram.txt         # 时序图
│
├── standards/                   # 规范文档
│   ├── naming-conventions.md    # 命名规范
│   ├── coding-style-guide.md    # 编码规范
│   └── file-structure.md        # 文件结构规范
│
├── architecture/                # 架构文档
│   └── principles.md            # 架构原则
│
├── guides/                      # 开发指南
│   └── design-philosophy.md     # 设计思想
│
└── references/                  # 归档参考
    ├── microservices.md
    ├── redis.md
    └── message-queue.md
```

---

*文档生成时间: 2025-12-22*  
*数据来源: 项目目录结构静态分析*
