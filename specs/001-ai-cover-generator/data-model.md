# Data Model: AI Cover Generator

**Date**: 2025-12-21
**Phase**: 1 - Design & Contracts

## Core Entities

### 1. CoverGenerationJob

Represents a user request to generate covers.

```typescript
interface CoverGenerationJob {
  id: string;
  userId?: string; // Optional - NVP phase may not require auth
  input: {
    text: string;
    contentType: "title" | "paragraph" | "article" | "blog";
    selectedStyle: string;
    targetPlatforms: Platform[];
  };
  status: "pending" | "processing" | "completed" | "failed";
  result?: CoverGenerationResult;
  createdAt: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}
```

### 2. ContentAnalysis

AI-processed content structure from the agent chain.

```typescript
interface ContentAnalysis {
  originalText: string;
  extractedTitle: string;
  keyPoints: string[];
  suggestedTags: string[];
  contentSummary: string;
  visualConcept: {
    mood: string;
    style: string;
    colorPalette: string[];
    composition: string;
  };
}
```

### 3. CoverTemplate

Reusable design template for different platforms.

```typescript
interface CoverTemplate {
  id: string;
  name: string;
  category: string;
  platform: Platform;
  aspectRatio: string;
  preview: string; // URL to preview image
  elements: TemplateElement[];
  constraints: TemplateConstraints;
}

interface TemplateElement {
  id: string;
  type: "title" | "subtitle" | "background" | "decoration" | "logo";
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
  };
  dynamic: boolean; // Whether content is injected dynamically
}
```

### 4. GeneratedCover

Result of the generation process.

```typescript
interface GeneratedCover {
  id: string;
  jobId: string;
  platform: Platform;
  imageUrl: string;
  thumbnailUrl?: string;
  templateUsed: string;
  titleUsed: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
  generatedAt: Date;
}
```

### 5. AIProvider

Configuration for AI service providers.

```typescript
interface AIProvider {
  id: string;
  name: string;
  type: "text-analysis" | "title-generation" | "image-generation" | "background-generation";
  endpoint: string;
  apiKey: string;
  model: string;
  config: Record<string, any>;
  priority: number; // For fallback logic
}
```

## Enums and Types

```typescript
type Platform = "xiaohongshu" | "wechat" | "product" | "custom";

interface PlatformSpec {
  id: Platform;
  name: string;
  aspectRatio: string;
  dimensions: { width: number; height: number };
  safeZones: {
    title: { x: number; y: number; width: number; height: number };
    content: { x: number; y: number; width: number; height: number };
  };
  textLimits: {
    title: number;
    subtitle: number;
  };
}

const PLATFORMS: Record<Platform, PlatformSpec> = {
  xiaohongshu: {
    id: "xiaohongshu",
    name: "小红书",
    aspectRatio: "9:16",
    dimensions: { width: 1080, height: 1920 },
    safeZones: {
      title: { x: 0, y: 200, width: 1080, height: 300 },
      content: { x: 100, y: 600, width: 880, height: 800 },
    },
    textLimits: { title: 30, subtitle: 100 },
  },
  wechat: {
    id: "wechat",
    name: "公众号",
    aspectRatio: "2.35:1",
    dimensions: { width: 900, height: 383 },
    safeZones: {
      title: { x: 50, y: 50, width: 600, height: 100 },
      content: { x: 50, y: 180, width: 800, height: 150 },
    },
    textLimits: { title: 50, subtitle: 150 },
  },
  product: {
    id: "product",
    name: "商品主图",
    aspectRatio: "1:1",
    dimensions: { width: 1000, height: 1000 },
    safeZones: {
      title: { x: 100, y: 100, width: 800, height: 200 },
      content: { x: 100, y: 400, width: 800, height: 400 },
    },
    textLimits: { title: 40, subtitle: 120 },
  },
  custom: {
    id: "custom",
    name: "自定义",
    aspectRatio: "custom",
    dimensions: { width: 1080, height: 1080 },
    safeZones: {
      title: { x: 100, y: 100, width: 880, height: 200 },
      content: { x: 100, y: 400, width: 880, height: 580 },
    },
    textLimits: { title: 50, subtitle: 200 },
  },
};
```

## State Transitions

```typescript
// CoverGenerationJob state machine
type JobStateTransition = {
  from: CoverGenerationJob["status"];
  to: CoverGenerationJob["status"];
  action: () => Promise<void>;
};

const JOB_TRANSITIONS: JobStateTransition[] = [
  { from: "pending", to: "processing", action: startProcessing },
  { from: "processing", to: "completed", action: completeJob },
  { from: "processing", to: "failed", action: handleFailure },
];
```

## Validation Rules

### Input Validation
```typescript
import { z } from "zod";

const CoverRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  contentType: z.enum(["title", "paragraph", "article", "blog"]),
  selectedStyle: z.string().min(1),
  targetPlatforms: z.array(z.enum(["xiaohongshu", "wechat", "product", "custom"])).min(1),
});
```

### Template Validation
```typescript
const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  platform: z.enum(["xiaohongshu", "wechat", "product", "custom"]),
  aspectRatio: z.string().regex(/^\d+:\d+$/),
  elements: z.array(TemplateElementSchema).min(1),
});
```

## Data Flow

1. **Input Phase**: User submits text and preferences → Creates `CoverGenerationJob`
2. **Analysis Phase**: AI agents process text → Creates `ContentAnalysis`
3. **Generation Phase**: Templates + analysis → Creates `GeneratedCover`s
4. **Storage Phase**: Upload images to R2 → Update job status

## Storage Strategy

### Edge State (No Database)
- Job state in memory for short-lived operations
- Session storage for user preferences
- Temporary URLs for generated images

### Persistent Storage (Future)
- PostgreSQL with Prisma ORM
- Indexes on:
  - `CoverGenerationJob.createdAt`
  - `GeneratedCover.jobId`
  - `CoverTemplate.platform`

### File Storage
- Cloudflare R2 for generated images
- Automatic cleanup after 7 days for NVP phase
- CDN distribution via custom domain

## Error Handling

```typescript
interface GenerationError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  provider?: string;
}

const ERROR_CODES = {
  AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE",
  CONTENT_MODERATION_FAILED: "CONTENT_MODERATION_FAILED",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  GENERATION_TIMEOUT: "GENERATION_TIMEOUT",
  STORAGE_FAILED: "STORAGE_FAILED",
} as const;
```

## Performance Considerations

- Lazy loading of templates
- Streaming AI responses
- Parallel processing for multiple platforms
- Image optimization with WebP format
- Edge caching for popular templates