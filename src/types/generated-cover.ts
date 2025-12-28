import { Platform, StyleTemplate, TextAnalysisResult } from "./index";

// TitleGenerationResult 暂时内联定义
interface TitleGenerationResult {
  titles: { text: string; confidence: number; platform: string }[];
}

// Cover Generation Job types
export interface CoverGenerationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  request: {
    text: string;
    platforms: string[];
    styleTemplate: string;
    customizations?: any;
  };
  results?: GeneratedCover[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTimeRemaining?: number;
  textAnalysis?: TextAnalysisResult;
  titleGeneration?: TitleGenerationResult;
}

// Generated cover specific types
export interface GeneratedCover {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  thumbnailUrl: string;
  platform: Platform;
  template: StyleTemplate;
  customizations: CoverCustomizations;
  metadata: CoverMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverCustomizations {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: {
    title: number;
    subtitle: number;
  };
  layout?: "center" | "top" | "bottom" | "left" | "right";
  additionalText?: {
    content: string;
    position: {
      x: number;
      y: number;
    };
    style: {
      fontSize: number;
      color: string;
      fontWeight?: "normal" | "bold";
    };
  }[];
}

export interface CoverMetadata {
  fileSize: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  colorProfile: string;
  dpi: number;
  generationTime: number;
  aiProvider?: string;
  prompt?: string;
}

export interface CoverEditRequest {
  id: string;
  customizations: Partial<CoverCustomizations>;
  regenerateImage?: boolean;
}

export interface CoverExportOptions {
  format: "png" | "jpg" | "webp";
  quality?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}