# 封面生成 API 文档

> 本文档描述 Cover 项目的封面生成 API 接口规格。

---

## 目的 Purpose

为前端开发者、第三方集成方提供完整的 API 调用指南。

## 适用范围 Scope

- `/api/generate` POST 接口
- `/api/generate` GET 接口
- `/api/generate/[jobId]` 状态查询

## 当前状态 Status

**Active** - 已在生产中使用

---

## 1. 接口概览

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/generate` | 创建封面生成任务 |
| GET | `/api/generate` | 列出所有任务 |
| GET | `/api/generate/[jobId]` | 查询任务状态 |

> **证据来源**: [src/app/api/generate/route.ts](file:///d:/C_Projects/Cover/src/app/api/generate/route.ts)

---

## 2. POST /api/generate

### 2.1 请求格式

**Content-Type**: `application/json`

```json
{
  "text": "这是一段需要生成封面的文字内容...",
  "platforms": ["xiaohongshu", "wechat"],
  "styleTemplate": "minimal-clean",
  "customizations": {}
}
```

### 2.2 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `text` | string | ✅ | 原文内容，10-10000 字符 |
| `platforms` | string[] | ✅ | 目标平台 ID 数组 |
| `styleTemplate` | string | ✅ | 风格模板 ID |
| `customizations` | object | ❌ | 自定义配置 |

### 2.3 可用平台 ID

| ID | 名称 | 尺寸 |
|----|------|------|
| `xiaohongshu` | 小红书 | 1080×1080 |
| `xiaohongshu-vertical` | 小红书 (竖版) | 720×1280 |
| `wechat` | 微信公众号 | 900×500 |
| `wechat-banner` | 公众号头图 | 900×383 |
| `taobao` | 淘宝/天猫 | 800×800 |
| `taobao-banner` | 淘宝横版 | 1200×800 |
| `douyin` | 抖音 | 720×1280 |
| `weibo` | 微博 | 1000×562 |
| `bilibili` | B站封面 | 1920×1080 |
| `zhihu` | 知乎 | 738×415 |

> **证据来源**: [src/lib/platforms/specs.ts](file:///d:/C_Projects/Cover/src/lib/platforms/specs.ts)

### 2.4 可用风格模板 ID

| ID | 名称 |
|----|------|
| `minimal-clean` | 简约清新 |
| `modern-bold` | 现代醒目 |
| `elegant-gold` | 轻奢金典 |
| `nature-fresh` | 自然清新 |
| `tech-blue` | 科技蓝调 |
| `warm-pink` | 温暖粉调 |
| `vintage-brown` | 复古棕调 |
| `gradient-purple` | 渐变紫韵 |
| `business-gray` | 商务灰度 |
| `artistic-multi` | 艺术多彩 |

> **证据来源**: [src/data/templates/index.ts](file:///d:/C_Projects/Cover/src/data/templates/index.ts)

### 2.5 成功响应

**HTTP 200**

```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "meta": {
    "requestId": "req_xxx",
    "timestamp": "2025-12-22T01:00:00.000Z"
  }
}
```

### 2.6 错误响应

**HTTP 400 - 请求无效**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "text": "Text must be at least 10 characters"
    }
  },
  "meta": {
    "requestId": "req_xxx"
  }
}
```

**HTTP 429 - 请求过多**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later."
  }
}
```

---

## 3. GET /api/generate

### 3.1 查询参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `status` | string | ❌ | 过滤任务状态 |

### 3.2 状态值

| 状态 | 说明 |
|------|------|
| `pending` | 等待处理 |
| `processing` | 处理中 |
| `completed` | 已完成 |
| `failed` | 失败 |

### 3.3 响应示例

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "status": "completed",
        "progress": 100,
        "createdAt": "2025-12-22T01:00:00.000Z",
        "updatedAt": "2025-12-22T01:01:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## 4. 验证步骤

### 4.1 使用 curl 测试

```bash
# 创建生成任务
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "这是一段测试文字，用于验证 API 功能是否正常工作。",
    "platforms": ["xiaohongshu"],
    "styleTemplate": "minimal-clean"
  }'

# 预期返回
# {"success":true,"data":{"jobId":"xxx"},"meta":{...}}

# 查询任务状态
curl http://localhost:3000/api/generate

# 预期返回
# {"success":true,"data":{"items":[...],"pagination":{...}}}
```

### 4.2 使用浏览器控制台测试

```javascript
fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: '这是一段测试文字，用于验证 API 功能是否正常工作。',
    platforms: ['xiaohongshu'],
    styleTemplate: 'minimal-clean'
  })
}).then(r => r.json()).then(console.log);
```

---

## 5. 中间件说明

### 5.1 内容审核

所有 POST 请求会经过内容审核中间件：

```typescript
withModeration(handlePostRequest, {
  fields: ['text'],
  mode: 'block',
})
```

如果 `text` 字段包含违规内容，请求将被拦截。

> **证据来源**: [src/app/api/generate/route.ts](file:///d:/C_Projects/Cover/src/app/api/generate/route.ts) 第 91-94 行

### 5.2 限流

默认限流配置：

| 配置项 | 默认值 |
|--------|--------|
| `RATE_LIMIT_MAX_REQUESTS` | 10 |
| `RATE_LIMIT_WINDOW_MS` | 60000 (1分钟) |

超过限制将返回 HTTP 429。

> **证据来源**: [.env.local.example](file:///d:/C_Projects/Cover/.env.local.example) 第 25-27 行

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| API 路由实现 | `src/app/api/generate/route.ts` |
| 平台配置 | `src/lib/platforms/specs.ts` |
| 风格模板 | `src/data/templates/index.ts` |
| 限流配置 | `.env.local.example` |

## 相关链接 Related

- [OpenAI 集成](openai-integration.md)
- [Cloudflare R2 集成](cloudflare-r2.md)
- [架构原则](../architecture/principles.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 初版创建，覆盖 POST/GET 接口规格 |
