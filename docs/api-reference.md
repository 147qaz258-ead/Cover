# API 参考文档

> **版本**: 1.0
> **最后更新**: 2025-12-24
> **基础路径**: `/api`

---

## 目录

1. [核心 API](#核心-api)
   - [封面生成](#封面生成)
   - [任务状态查询](#任务状态查询)
2. [配置 API](#配置-api)
   - [模型列表](#模型列表)
   - [视觉风格列表](#视觉风格列表)
3. [类型定义](#类型定义)
4. [前端集成指南](#前端集成指南)

---

## 核心 API

### 封面生成

**创建生成任务**

```
POST /api/generate
```

#### 请求体

```typescript
interface CoverGenerationRequest {
  text: string;                    // 用户输入的文本内容（10-10000 字符）
  platforms: string[];             // 目标平台 ID 列表
  styleTemplate: string;           // 风格模板 ID
  modelId?: string;                // 图像生成模型 ID（可选）
  visualStyleId?: string;          // 视觉风格 ID（可选）
  customizations?: {               // 自定义样式（可选）
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
}
```

#### 请求示例

```json
{
  "text": "10个提高工作效率的方法...",
  "platforms": ["wechat", "xiaohongshu"],
  "styleTemplate": "minimal-clean",
  "modelId": "laozhang/gemini-3-pro-image-preview",
  "visualStyleId": "illustration-watercolor"
}
```

#### 响应

```typescript
// 成功 (200)
{
  success: true,
  data: {
    jobId: string;  // 任务 ID，用于轮询状态
  }
}

// 失败 (400/500)
{
  success: false,
  error: {
    message: string;
    code?: string;
  }
}
```

---

### 任务状态查询

**查询生成任务状态**

```
GET /api/generate/{jobId}
```

#### 响应

```typescript
{
  success: true,
  data: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;              // 0-100
    request: CoverGenerationRequest;
    results?: CoverGenerationResult[];  // 完成时有值
    error?: string;                     // 失败时有值
    createdAt: string;             // ISO 8601
    updatedAt: string;             // ISO 8601
    estimatedTimeRemaining?: number;   // 毫秒
  }
}
```

#### CoverGenerationResult 结构

```typescript
interface CoverGenerationResult {
  id: string;
  platform: {
    id: string;
    name: string;
    dimensions: { width: number; height: number };
  };
  imageUrl: string;         // 生成的图片 URL
  thumbnailUrl: string;     // 缩略图 URL
  title: string;            // AI 生成的标题
  metadata: {
    fileSize: number;
    format: string;
    dimensions: { width: number; height: number };
  };
}
```

**删除任务**

```
DELETE /api/generate/{jobId}
```

> 仅可删除 `completed` 或 `failed` 状态的任务

---

## 配置 API

### 模型列表

**获取可用的图像生成模型**

```
GET /api/models
```

#### 响应

```typescript
{
  success: true,
  data: [{
    id: string;              // 如 "laozhang/gemini-3-pro-image-preview"
    name: string;            // 显示名称，如 "Nano Banana Pro"
    provider: string;        // 如 "openai-compatible"
    capabilities: {
      aspectRatios?: string[];
      maxResolution?: string;
    };
    pricing?: {
      perImage: number;      // 如 0.05
      currency: string;      // 如 "USD"
    };
    priority: number;        // 优先级（越小越高）
    isDefault?: boolean;     // 是否默认模型
  }]
}
```

---

### 视觉风格列表

**获取视觉风格模板**

```
GET /api/visual-styles
GET /api/visual-styles?category={category}
```

#### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `category` | string | 可选，筛选分类：`realistic`, `illustration`, `abstract` |

#### 响应

```typescript
{
  success: true,
  data: [{
    id: string;              // 如 "illustration-watercolor"
    name: string;            // 如 "水彩插画"
    description: string;
    preview: string;         // 预览图 URL
    category: string;
    isRecommended?: boolean;
  }]
}
```

---

## 类型定义

### 平台 ID

| ID | 名称 | 宽高比 | 尺寸 |
|----|------|--------|------|
| `wechat` | 微信公众号 | 16:9 | 900×500 |
| `xiaohongshu` | 小红书 | 3:4 | 1080×1440 |
| `douyin` | 抖音 | 9:16 | 1080×1920 |
| `weibo` | 微博 | 16:9 | 1200×675 |
| `bilibili` | B站 | 16:9 | 1146×717 |
| `zhihu` | 知乎 | 16:9 | 1920×1080 |

### 风格模板 ID

| ID | 名称 |
|----|------|
| `minimal-clean` | 极简清新 |
| `modern-bold` | 现代醒目 |
| `elegant-gold` | 典雅金色 |
| `nature-fresh` | 自然清新 |
| `tech-blue` | 科技蓝 |

---

## 前端集成指南

### 完整生成流程

```typescript
// 1. 获取可用模型和风格
const [modelsRes, stylesRes] = await Promise.all([
  fetch('/api/models'),
  fetch('/api/visual-styles')
]);
const models = await modelsRes.json();
const styles = await stylesRes.json();

// 2. 提交生成请求
const generateRes = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: userText,
    platforms: ['wechat', 'xiaohongshu'],
    styleTemplate: 'minimal-clean',
    modelId: selectedModel?.id,
    visualStyleId: selectedStyle?.id,
  })
});
const { data: { jobId } } = await generateRes.json();

// 3. 轮询任务状态
const pollStatus = async () => {
  const res = await fetch(`/api/generate/${jobId}`);
  const { data: job } = await res.json();
  
  if (job.status === 'completed') {
    return job.results;  // CoverGenerationResult[]
  } else if (job.status === 'failed') {
    throw new Error(job.error);
  } else {
    // 更新进度 UI
    updateProgress(job.progress);
    // 继续轮询
    setTimeout(pollStatus, 1000);
  }
};

const results = await pollStatus();
```

### 错误处理

```typescript
try {
  const res = await fetch('/api/generate', { ... });
  const data = await res.json();
  
  if (!data.success) {
    // API 返回的错误
    console.error(data.error.message);
  }
} catch (error) {
  // 网络错误
  console.error('Network error:', error);
}
```

---

## 相关文档

- [图像生成架构](./features/image-generation-architecture.md)
- [设计师提示词系统](./features/designer-prompt-system.md)
