# Cover 项目编码规范

> 本文档基于项目实际配置和代码模式提取，确保与代码库一致。

---

## 1. 工具链配置

### 1.1 ESLint 配置

> 来源: `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**核心规则**:
- 继承 Next.js Core Web Vitals 规则集
- 使用 TypeScript 解析器
- 未使用变量：警告级别
- 显式 any 类型：警告级别（推荐避免使用）

### 1.2 Prettier 配置

> 来源: `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

**格式化规则**:
| 规则 | 值 | 说明 |
|------|-----|------|
| 分号 | 必须 | 语句末尾添加分号 |
| 尾逗号 | ES5 兼容 | 对象/数组末尾添加逗号 |
| 引号 | 单引号 | 字符串使用单引号 |
| 行宽 | 100 字符 | 超过自动换行 |
| 缩进 | 2 空格 | 使用空格而非 Tab |

---

## 2. 架构约束条款

> 来源: `CLAUDE.md` 第 31-45 行

### 2.1 外部依赖使用规范

| 条款 | 约束内容 |
|------|----------|
| **禁止自实现算法** | 核心算法必须委托给成熟外部依赖库，不得在项目中编写底层逻辑 |
| **禁止构建封装层** | 不得构建 Wrapper Class 或适配器模式隐藏依赖库实现 |
| **禁止裁剪依赖** | 不得对依赖库进行功能裁剪、逻辑重写或复制代码到本地 |
| **必须完整加载** | 通过包管理器 (npm) 加载完整生产级实现 |

### 2.2 数据处理规范

| 条款 | 约束内容 |
|------|----------|
| **立即提取核心数据** | 外部库返回的复杂对象必须在调用返回后立即提取最小核心数据并丢弃原对象 |
| **本地清洗数据** | 所有 UI 与业务决策必须基于本地清洗后的核心数据（Single Source of Truth） |
| **禁止依赖外部状态** | 不得依赖外部库的内部状态作为业务逻辑的判断依据 |

### 2.3 函数职责规范

| 条款 | 约束内容 |
|------|----------|
| **分离纯计算与 IO** | 单个函数不得混合"数据处理"与"IO操作" |
| **单一职责** | 胶水代码仅允许负责单一流程节点的参数组装与调用调度 |
| **无状态管道优先** | 应优先通过无状态的 Pipeline 方式串联外部库能力，避免复杂状态机 |

### 2.4 错误处理规范

| 条款 | 约束内容 |
|------|----------|
| **禁止吞异常** | 不得吞掉外部库抛出的异常 |
| **禁止透传底层错误** | 不得透传原始底层报错 |
| **必须转换错误** | 必须捕获并转换为具有业务语义的错误结果 |

### 2.5 其他规范

| 条款 | 约束内容 |
|------|----------|
| **参数边界校验** | 调用外部库前必须利用强类型或 Schema 校验库在入口处拦截非法输入 |
| **精准命名** | 禁止使用语义模糊的变量名（如 data, obj, res） |
| **禁止魔法值** | 业务代码中不得硬编码魔法值或环境配置 |
| **验证后使用** | 在未查阅文档或验证源码行为前，禁止直接编写集成代码 |
| **导入必须使用** | 生成的代码必须确保所有导入路径真实参与运行 |
| **资源生命周期** | 必须利用 try-finally 机制确保资源释放 |

---

## 3. 类型安全规范

### 3.1 使用 Zod 进行运行时校验

> 来源: `src/lib/validation/schemas.ts`

**所有 API 入口必须使用 Zod Schema 校验**:

```typescript
// 正确示例
import { ApiSchemas } from "@/lib/validation/schemas";

const { data, error } = await validateRequest(request, ApiSchemas.GenerateCover);
if (error) {
  return error;
}
// data 已经过类型安全校验
```

**已定义的 Schema 列表**:

| Schema 名称 | 用途 |
|-------------|------|
| `CoverGenerationRequestSchema` | 封面生成请求校验 |
| `PlatformSchema` | 平台配置校验 |
| `StyleTemplateSchema` | 风格模板校验 |
| `TextAnalysisResultSchema` | 文本分析结果校验 |
| `GeneratedTitleSchema` | 生成标题校验 |
| `ImageGenerationRequestSchema` | 图像生成请求校验 |

### 3.2 常用校验规则

| 字段类型 | Zod 校验 | 示例 |
|----------|----------|------|
| 非空字符串 | `z.string().min(1)` | `id: z.string().min(1)` |
| UUID | `z.string().uuid()` | `jobId: z.string().uuid()` |
| 正整数 | `z.number().positive()` | `width: z.number().positive()` |
| 枚举 | `z.enum([...])` | `status: z.enum(["pending", "completed"])` |
| 颜色值 | `z.string().regex(/^#[0-9A-F]{6}$/i)` | `backgroundColor: z.string().regex(...)` |
| 可选字段 | `.optional()` | `language: z.string().optional()` |
| 范围限制 | `.min().max()` | `text: z.string().min(10).max(10000)` |

---

## 4. 错误处理模式

### 4.1 API 响应格式

> 来源: `src/lib/api/response.ts`

```typescript
// 成功响应
ApiResponse.success(data, { requestId });

// 错误响应
ApiResponse.error(new Error("Rate limit exceeded"), 429, { requestId });

// 分页响应
ApiResponse.paginated(items, pagination, { requestId });
```

**统一响应结构**:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
    version?: string;
  };
}
```

### 4.2 Agent 层错误处理

```typescript
// 正确示例 - 捕获并转换为业务错误
try {
  const result = await this.openai.generateText(prompt, options);
  return this.parseResponse(result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  this.agentLogger.error("Text analysis failed", { error: errorMessage });
  throw new Error(`Failed to analyze text: ${errorMessage}`);
}
```

---

## 5. 日志规范

### 5.1 日志层级

| 级别 | 用途 | 生产环境 |
|------|------|----------|
| `error` | 错误与异常 | ✅ 记录 |
| `warn` | 警告信息 | ✅ 记录 |
| `info` | 业务关键节点 | ✅ 记录 |
| `debug` | 调试信息 | ❌ 不记录 |

### 5.2 日志使用模式

```typescript
// 创建模块级日志器
private readonly pipelineLogger = logger.child({ component: "CoverPipeline" });

// 创建请求级日志器
const requestLogger = createRequestLogger(requestId);

// 记录关键业务节点
requestLogger.info("Starting cover generation pipeline", {
  platforms: request.platforms,
  templateId: request.styleTemplate,
});
```

### 5.3 日志上下文字段

| 字段 | 说明 |
|------|------|
| `component` | 组件名称 |
| `agent` | AI 代理名称 |
| `jobId` | 任务 ID |
| `requestId` | 请求 ID |
| `platformId` | 平台 ID |
| `error` | 错误信息 |

---

## 6. React 组件规范

### 6.1 组件结构

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CoverGeneratorProps {
  onComplete?: (results: CoverGenerationResult[]) => void;
  showInfiniteCanvas?: boolean;
}

export function CoverGenerator({ onComplete, showInfiniteCanvas = false }: CoverGeneratorProps) {
  const [state, setState] = useState<GenerationState>({ status: "idle", progress: 0 });
  
  // 业务逻辑...
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

**要求**:
- 使用函数组件 + Hooks
- Props 必须定义 interface
- 客户端组件必须声明 `"use client"`
- 状态类型必须显式定义

### 6.2 组件目录结构

```
src/components/
├── covers/           # 封面业务组件
│   ├── cover-generator.tsx
│   └── cover-gallery.tsx
├── forms/            # 表单组件
│   ├── text-input.tsx
│   └── platform-selector.tsx
├── ui/               # 通用 UI 组件
│   ├── button.tsx
│   └── card.tsx
└── layout/           # 布局组件
    └── header.tsx
```

---

## 7. 命令与工作流

### 7.1 开发命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run type-check` | 运行 TypeScript 类型检查 |
| `npm test` | 运行测试 |

### 7.2 提交前检查清单

- [ ] `npm run lint` 无错误
- [ ] `npm run type-check` 无错误
- [ ] 所有导入路径真实参与运行
- [ ] 无硬编码魔法值
- [ ] 错误已转换为业务语义

---

*文档生成时间: 2025-12-22*  
*数据来源: 项目配置文件与源代码静态分析*
