import { z } from "zod";

// Platform validation
export const PlatformSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  aspectRatio: z.string().regex(/^\d+:\d+$/),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  maxFileSize: z.number().positive(),
  supportedFormats: z.array(z.string()),
});

// Style template validation
export const StyleTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  preview: z.string().url(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  fontFamily: z.string().min(1),
  fontSize: z.object({
    title: z.number().positive(),
    subtitle: z.number().positive(),
  }),
  layout: z.enum(["center", "top", "bottom", "left", "right"]),
});

// Cover generation request validation
export const CoverGenerationRequestSchema = z.object({
  text: z.string().min(10).max(10000),
  platforms: z.array(z.string().min(1)).min(1).max(10),
  styleTemplate: z.string().min(1),
  modelId: z.string().optional(),
  visualStyleId: z.string().optional(),
  customizations: z.object({
    backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    textColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    fontFamily: z.string().min(1).optional(),
  }).optional(),
});

// Job status validation
export const JobStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);

// Cover generation job validation
export const CoverGenerationJobSchema = z.object({
  id: z.string().uuid(),
  status: JobStatusSchema,
  request: CoverGenerationRequestSchema,
  results: z.array(z.any()).optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  progress: z.number().min(0).max(100).optional(),
});

// API request validation schemas
export const GenerateCoverRequestSchema = CoverGenerationRequestSchema;

export const JobStatusRequestSchema = z.object({
  jobId: z.string().uuid(),
});

export const GetJobRequestSchema = z.object({
  jobId: z.string().uuid(),
});

export const ListJobsRequestSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  status: JobStatusSchema.optional(),
});

// Text analysis validation
export const TextAnalysisRequestSchema = z.object({
  text: z.string().min(10).max(10000),
  language: z.string().optional(),
});

export const TextAnalysisResultSchema = z.object({
  keyPoints: z.array(z.string().min(1)),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  topics: z.array(z.string().min(1)),
  keywords: z.array(z.string().min(1)),
  summary: z.string().min(1),
});

// Title generation validation
export const TitleGenerationRequestSchema = z.object({
  text: z.string().min(10).max(10000),
  platform: z.string().min(1),
  count: z.coerce.number().positive().max(10).default(5),
});

export const GeneratedTitleSchema = z.object({
  text: z.string().min(1),
  confidence: z.number().min(0).max(1),
  platform: z.string().min(1),
});

// Image generation validation
export const ImageGenerationRequestSchema = z.object({
  prompt: z.string().min(5).max(1000),
  style: z.string().optional(),
  size: z.enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]).optional(),
  quality: z.enum(["standard", "hd"]).optional(),
  provider: z.enum(["openai", "replicate"]).optional(),
});

// Export all schemas for use in API routes
export const ApiSchemas = {
  GenerateCover: GenerateCoverRequestSchema,
  JobStatus: JobStatusRequestSchema,
  GetJob: GetJobRequestSchema,
  ListJobs: ListJobsRequestSchema,
  TextAnalysis: TextAnalysisRequestSchema,
  TitleGeneration: TitleGenerationRequestSchema,
  ImageGeneration: ImageGenerationRequestSchema,
};