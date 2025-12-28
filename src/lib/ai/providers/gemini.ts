import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(prompt: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    const model = this.client.getGenerativeModel({
      model: options?.model || "gemini-3-flash-preview",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async generateTextWithImage(prompt: string, imageData: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    const model = this.client.getGenerativeModel({
      model: options?.model || "gemini-pro-vision",
    });

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  }
}

// Singleton instance
let geminiInstance: GeminiProvider | null = null;

export function getGeminiProvider(): GeminiProvider {
  if (!geminiInstance) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Google AI API key not configured");
    }
    geminiInstance = new GeminiProvider(apiKey);
  }
  return geminiInstance;
}