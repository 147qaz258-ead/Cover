# 程序设计核心思想

> 本文档结合 Cover 项目实践，将通用设计原则具体化为可落地的指导方针。

---

## 1. 问题驱动开发

### 1.1 先定义问题

```
❌ 错误顺序: 写代码 → 发现不对 → 重写
✅ 正确顺序: 定义问题 → 设计方案 → 实现 → 验证
```

### 1.2 Cover 项目示例

**问题定义**:
> 用户输入一段文字，需要为 10 个社交平台自动生成符合尺寸要求的封面图

**分解为子问题**:
1. 如何理解用户文字的核心内容？→ 文本分析 Agent
2. 如何生成吸引人的标题？→ 标题生成 Agent
3. 如何创建符合平台尺寸的图像？→ 图像生成 Agent
4. 如何存储生成的图像？→ Cloudflare R2

---

## 2. 大问题拆小问题

### 2.1 分治策略

```
封面生成
├── 文本分析 (独立子问题)
│   ├── 提取关键点
│   ├── 识别情感
│   └── 生成摘要
├── 标题生成 (依赖文本分析)
│   ├── 按平台定制
│   └── 多候选排序
├── 图像生成 (依赖标题)
│   ├── 构建 prompt
│   ├── 选择 AI 提供商
│   └── 上传到 R2
└── 结果组装 (依赖所有)
```

### 2.2 Cover 项目的管道实现

```typescript
// 每个步骤独立，通过数据传递串联
const analysis = await textAnalyzer.analyzeText(request.text);
const titles = await titleGenerator.generateTitles(text, analysis, platformId);
const imageUrl = await imageGenerator.generateImage({ title, platform, template });
```

---

## 3. KISS 原则 (Keep It Simple, Stupid)

### 3.1 简单优先

| 场景 | 简单方案 | 复杂方案（避免） |
|------|----------|------------------|
| 状态管理 | useState + useReducer | Redux + Saga |
| 数据流 | 线性管道 | 复杂状态机 |
| Provider 适配 | 薄封装，直接调用 SDK | 多层抽象适配器模式 |

### 3.2 Cover 项目的简单设计

```typescript
// ✅ 简单: Provider 直接封装 SDK
export class OpenAIProvider {
  async generateText(prompt: string, options?: {...}) {
    return this.client.chat.completions.create({...});
  }
}

// ❌ 复杂: 过度抽象
interface AIProvider { ... }
class OpenAIAdapter implements AIProvider { ... }
class ProviderFactory { ... }
```

---

## 4. DRY 原则 (Don't Repeat Yourself)

### 4.1 提取复用逻辑

**重复代码信号**:
- 相同的错误处理模式出现多次
- 相同的日志记录模式出现多次
- 相同的数据转换逻辑出现多次

### 4.2 Cover 项目示例

```typescript
// ✅ 复用: 统一的日志器工厂
const requestLogger = createRequestLogger(requestId);

// ✅ 复用: 统一的响应构建器
return ApiResponse.success(data, { requestId });
return ApiResponse.error(error, 400, { requestId });
```

---

## 5. 单一职责原则

### 5.1 一个函数只做一件事

| 类 | 职责 |
|----|------|
| `TextAnalysisAgent` | 只负责文本分析 |
| `TitleGenerationAgent` | 只负责标题生成 |
| `ImageGenerationAgent` | 只负责图像生成 |
| `CoverGenerationPipeline` | 只负责编排步骤顺序 |

### 5.2 职责分离检查

```
如果无法用一句话描述一个函数/类的职责，说明它承担了过多责任。
```

---

## 6. 可读性优先

### 6.1 命名即文档

```typescript
// ❌ 难以理解
const r = await p.gt(t, a, pid);

// ✅ 清晰明了
const titles = await titleGenerator.generateTitles(text, analysis, platformId);
```

### 6.2 结构化代码

```typescript
// ✅ 清晰的步骤划分
// Step 1: Analyze text
const analysis = await textAnalyzer.analyzeText(request.text);

// Step 2: Generate titles
const titlesByPlatform = await Promise.all(titlePromises);

// Step 3: Generate images
const imageUrls = await Promise.all(imagePromises);

// Step 4: Assemble results
const results = request.platforms.map(...);
```

---

## 7. 合理注释

### 7.1 注释解释"为什么"

```typescript
// ❌ 解释"怎么做" - 冗余
// 遍历平台数组
for (const platform of platforms) { ... }

// ✅ 解释"为什么" - 有价值
// 使用 OpenAI 作为默认提供商，因为其图像质量更高
// Replicate 仅用于 B站/抖音等需要更具创意风格的平台
private selectProvider(platform: Platform): "openai" | "replicate" {
  if (platform.id === "bilibili" || platform.id === "douyin") {
    return "replicate";
  }
  return "openai";
}
```

---

## 8. Make it work → Make it right → Make it fast

### 8.1 三阶段开发

| 阶段 | 目标 | Cover 项目示例 |
|------|------|----------------|
| **Make it work** | 能跑起来 | 基本的生成流程通了 |
| **Make it right** | 代码清晰 | 分离 Agent、Pipeline、Provider |
| **Make it fast** | 性能优化 | TODO: 缩略图生成、文件大小计算 |

### 8.2 避免过早优化

```
先解决问题，再优化性能。
没有运行的代码是无法优化的。
```

---

## 9. 错误是朋友

### 9.1 错误处理模式

```typescript
// Cover 项目的错误处理
try {
  const result = await this.openai.generateText(prompt, options);
  return this.parseResponse(result);
} catch (error) {
  // 1. 提取错误信息
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  
  // 2. 记录日志
  this.agentLogger.error("Text analysis failed", { error: errorMessage });
  
  // 3. 转换为业务错误
  throw new Error(`Failed to analyze text: ${errorMessage}`);
}
```

### 9.2 不要吞掉异常

```typescript
// ❌ 吞掉异常
try { ... } catch (e) { return null; }

// ✅ 适当处理
try { ... } catch (e) {
  logger.error("...", { error });
  throw new BusinessError("...");
}
```

---

## 10. 测试你的代码

### 10.1 测试优先级

| 优先级 | 测试类型 | Cover 项目示例 |
|--------|----------|----------------|
| P0 | 核心业务逻辑 | Pipeline 流程测试 |
| P1 | Agent 功能 | 文本分析、标题生成测试 |
| P2 | Provider 适配 | OpenAI/Replicate 调用测试 |
| P3 | UI 组件 | 组件渲染测试 |

### 10.2 运行测试命令

```bash
npm test
npm run lint
npm run type-check
```

---

## 11. 版本控制是必备技能

### 11.1 提交规范

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
refactor: 重构代码
test: 添加测试
chore: 杂项更新
```

### 11.2 分支策略

```
main       ← 生产分支
└── dev    ← 开发分支
    └── feature/xxx  ← 功能分支
```

---

## 12. 持续学习

### 12.1 编程成长路径

```
入门: 能写出能跑的代码
进阶: 能写出别人能读懂的代码
高级: 能设计出易于扩展的架构
专家: 能在复杂约束下做出正确的权衡
```

### 12.2 Cover 项目的学习点

- Next.js App Router 最佳实践
- AI Agent 设计模式
- 无状态管道编排
- 薄适配层 vs 过度抽象

---

*文档生成时间: 2025-12-22*  
*数据来源: Cover 项目实践总结*
