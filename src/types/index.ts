// Core types for AI Cover Generator

export interface Platform {
  id: string;
  name: string;
  aspectRatio: string;
  dimensions: {
    width: number;
    height: number;
  };
  maxFileSize: number; // in bytes
  supportedFormats: string[];
}

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: {
    title: number;
    subtitle: number;
  };
  layout: "center" | "top" | "bottom" | "left" | "right";
}

export interface CoverGenerationRequest {
  text: string;
  platforms: Platform["id"][];
  styleTemplate: StyleTemplate["id"];
  /** 指定使用的图像生成模型 ID（可选，默认使用注册表中的最高优先级模型） */
  modelId?: string;
  /** 视觉风格模板 ID（可选，用于注入特定风格提示词） */
  visualStyleId?: string;
  customizations?: {
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
}

export interface CoverGenerationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  request: CoverGenerationRequest;
  results?: CoverGenerationResult[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  progress?: number;
}

export interface CoverGenerationResult {
  id: string;
  platform: Platform;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  subtitle?: string;
  template?: {
    id: string;
    name: string;
  };
  customizations?: CoverCustomizations;
  createdAt?: Date | string;
  metadata: {
    fileSize: number;
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  // Generation context for re-edit functionality
  inputText?: string; // Original input text
  visualStyleId?: string; // Visual style template used
  modelId?: string; // Model ID used for generation
  platforms?: Platform["id"][]; // All platforms selected
  customizationsConfig?: CoverCustomizations; // Full customizations
}

export interface TextAnalysisResult {
  keyPoints: string[];
  sentiment: "positive" | "negative" | "neutral";
  topics: string[];
  keywords: string[];
  summary: string;
}

export interface GeneratedTitle {
  text: string;
  confidence: number;
  platform: Platform["id"];
}

export interface AIProvider {
  id: string;
  name: string;
  type: "text" | "image" | "multimodal";
  capabilities: string[];
}

export interface APIResponse<T = any> {
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

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CoverCustomizations {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: number | { title?: number; subtitle?: number };
  textAlign?: "left" | "center" | "right";
  padding?: number;
  borderRadius?: number;
  shadow?: boolean;
  layout?: "center" | "top" | "bottom" | "left" | "right";
}