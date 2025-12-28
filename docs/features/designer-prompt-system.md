# 设计师提示词系统 - 实现总结

> 完成时间：2025-12-23

## 变更概述

将硬编码的图片提示词生成改为 **LLM 驱动的智能设计师**，支持 6 种视觉风格模板注入。

```
用户内容 → 设计师 LLM → 基础提示词 → 风格注入（可选）→ 图片生成
```

## 文件变更

| 操作 | 文件 |
|------|------|
| NEW | `src/lib/ai/prompts/designer-prompt.txt` |
| NEW | `src/lib/ai/prompts/loader.ts` |
| NEW | `src/types/visual-style.ts` |
| NEW | `src/lib/ai/prompts/visual-styles/index.ts` |
| NEW | `src/components/forms/visual-style-selector.tsx` |
| NEW | `src/app/api/visual-styles/route.ts` |
| MODIFY | `src/lib/ai/agents/image-generator.ts` |
| MODIFY | `src/types/index.ts` |
| MODIFY | `src/lib/validation/schemas.ts` |
| MODIFY | `src/lib/ai/pipeline/cover-pipeline.ts` |

## 架构说明

### 设计师 LLM 流程

1. **加载系统提示词**：`designer-prompt.txt` 包含变量 `{user_content}`, `{platform}`, `{dimensions}`
2. **调用 Gemini**：生成包含 `[STYLE_PLACEHOLDER]` 占位符的基础提示词
3. **风格注入**：若用户选择了视觉风格，用 `promptFragment` 替换占位符
4. **降级机制**：LLM 调用失败时使用 `buildFallbackPrompt()` 硬编码方案

### 视觉风格模板

| ID | 名称 | 分类 |
|----|------|------|
| `realistic-product` | 实物产品风 | realistic |
| `realistic-food` | 美食实拍风 | realistic |
| `illustration-flat` | 扁平插画风 | illustration |
| `illustration-watercolor` | 水彩手绘风 | illustration |
| `manga-anime` | 日系动漫风 | manga |
| `abstract-gradient` | 渐变几何风 | abstract |

### API

- `GET /api/visual-styles` - 返回风格列表（不含 `promptFragment`）
- `GET /api/visual-styles?category=realistic` - 按分类筛选

## 验证结果

- ✅ TypeScript 编译通过 (`npx tsc --noEmit`)
- ✅ 新增类型定义正确导出
- ✅ API 路由已创建

## 使用方式

### 后端：Pipeline 中使用

```typescript
// cover-pipeline.ts 中已集成
if (request.visualStyleId) {
  const visualStyle = getVisualStyleTemplate(request.visualStyleId);
  if (visualStyle) {
    visualStylePrompt = visualStyle.promptFragment;
  }
}
```

### 前端：集成 VisualStyleSelector

```tsx
import { VisualStyleSelector } from '@/components/forms/visual-style-selector';

// 在 CoverGenerator 表单中添加
<VisualStyleSelector
  value={visualStyleId}
  onChange={setVisualStyleId}
  disabled={isGenerating}
/>
```

## 手动测试步骤

1. 启动开发服务器：`npm run dev`
2. 访问 `http://localhost:3000/api/visual-styles` 确认返回 6 种风格
3. 在生成页面选择视觉风格并生成，检查日志确认风格注入

**预期日志**：
```
[CoverPipeline] 🎨 已选择视觉风格: 实物产品风
[ImageGenerator] 🎨 调用设计师 LLM...
[ImageGenerator] 🖌️ 已注入风格模板
```
