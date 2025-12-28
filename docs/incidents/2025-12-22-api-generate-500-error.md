# 故障复盘报告：/api/generate 500 Internal Server Error

**日期**: 2025-12-22
**状态**: ✅ 已修复
**影响范围**: 所有封面生成请求 (100% 失败)
**严重等级**: P0 (Core Blocker)

## 1. 故障描述
用户在使用 `/api/generate` 接口生成封面时，服务端返回 500 Internal Server Error，前端报错 "Unexpected end of JSON input"。

## 2. 根因分析 (Root Cause Analysis)

### 2.1 主要原因：Analytics 初始化逻辑错误
- **位置**: `src/lib/middleware/analytics-middleware.ts` -> `initializeAppAnalytics`
- **问题**: 初始化函数包含 `if (typeof window === "undefined") return;` 检查，导致在服务端环境（Node.js API Route）下 `analytics` 模块未被初始化。
- **后果**: 当 `handlePostRequest` 尝试调用 `analytics.track()` 时，因为单例未初始化而抛出 "Analytics not initialized" 异常。

### 2.2 次要原因：OpenAI API Key 配置无效
- **位置**: `.env.local`
- **问题**: `OPENAI_API_KEY` 配置的是示例占位符 `your_openai_api_key_here`。
- **后果**: 即使解决了 500 错误，默认使用 OpenAI 的 `TextAnalysisAgent` 和 `TitleGenerationAgent` 也会因 401 Unauthorized 而失败。

### 2.3 外围原因：Google Gemini 速率限制
- **位置**: Google AI Studio API
- **问题**: 免费版 Gemini API 配额较低，高频请求触发 `429 Too Many Requests`。
- **后果**: 图像生成步骤偶尔失败（虽然已有 Fallback 机制）。

## 3. 修复方案 (Resolution)

### 3.1 代码修复
- 修改 `src/lib/middleware/analytics-middleware.ts`，移除服务端的初始化阻断检查，允许 Analytics 在服务端运行（输出到控制台）。

### 3.2 架构调整
- **迁移 Text/Title Agents**: 将 `TextAnalysisAgent` 和 `TitleGenerationAgent` 的 Provider 从 OpenAI 迁移至 **Google Gemini** (`gemini-2.5-flash`)，复用已正确配置的 `GOOGLE_AI_API_KEY`。
- **优化图像生成策略**: 修改 `src/lib/ai/config/image-models.ts`，将 **老张 API (Laozhang API)** 转接的 Gemini 3 Pro 设为第一顺位 (`priority: 0`)，Flux 作为备选。

## 4. 验证结果
- `/api/generate` 接口返回 200 OK。
- 文本分析、标题生成、图像生成全流程跑通。
- Browser Network面板及 VS Code 终端日志显示完整 JSON 响应。

## 5. 后续行动 (Action Items)
- [x] 更新系统架构文档，反映 AI Provider 的变更。
- [x] 更新图像生成配置文档，说明 fallback 策略。
