import { CoverGenerationJob, CoverGenerationRequest } from "./index";

// Job management types
export interface JobQueue {
  pending: CoverGenerationJob[];
  processing: CoverGenerationJob[];
  completed: CoverGenerationJob[];
  failed: CoverGenerationJob[];
}

export interface JobStatus {
  id: string;
  status: CoverGenerationJob["status"];
  progress: number;
  estimatedTimeRemaining?: number;
  currentStep?: string;
  totalSteps?: number;
}

export interface JobCreateRequest {
  request: CoverGenerationRequest;
  priority?: "low" | "normal" | "high";
  webhookUrl?: string;
}

export interface JobUpdate {
  status: CoverGenerationJob["status"];
  progress?: number;
  results?: any;
  error?: string;
  currentStep?: string;
}