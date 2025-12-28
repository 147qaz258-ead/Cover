import { AIProvider } from "@/types";
import { getOpenAIProvider, createOpenAICompatibleProvider, OpenAIProvider, type ImageGenerateOptions } from "./openai";
import { getGeminiProvider } from "./gemini";
import { getReplicateProvider } from "./replicate";
import { getGeminiImageProvider, createGeminiImageProvider, GeminiImageProvider } from "./gemini-image";

export {
  getOpenAIProvider,
  createOpenAICompatibleProvider,
  OpenAIProvider,
  ImageGenerateOptions,
  getGeminiProvider,
  getReplicateProvider,
  getGeminiImageProvider,
  createGeminiImageProvider,
  GeminiImageProvider,
};

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    type: "multimodal",
    capabilities: ["text-generation", "image-generation", "moderation"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    type: "multimodal",
    capabilities: ["text-generation", "image-analysis"],
  },
  {
    id: "replicate",
    name: "Replicate",
    type: "image",
    capabilities: ["image-generation", "image-upscaling"],
  },
];

export function getAIProvider(providerId: string) {
  switch (providerId) {
    case "openai":
      return getOpenAIProvider();
    case "gemini":
      return getGeminiProvider();
    case "replicate":
      return getReplicateProvider();
    default:
      throw new Error(`Unknown AI provider: ${providerId}`);
  }
}

export function getAvailableProviders(): AIProvider[] {
  return AI_PROVIDERS.filter(provider => {
    switch (provider.id) {
      case "openai":
        return !!process.env.OPENAI_API_KEY;
      case "gemini":
        return !!process.env.GOOGLE_AI_API_KEY;
      case "replicate":
        return !!process.env.REPLICATE_API_TOKEN;
      default:
        return false;
    }
  });
}