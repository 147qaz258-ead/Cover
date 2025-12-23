/**
 * @deprecated 此文件已废弃 (2025-12-23)
 * 
 * 文本分析功能已合并到 CoverCreativeDirector Agent 中。
 * 新架构通过单次 LLM 调用完成文本分析、标题生成和图片提示词生成。
 * 
 * @see cover-creative-director.ts
 */

import { TextAnalysisResult } from "@/types";
import { getGeminiProvider } from "@/lib/ai/providers";
import { logger } from "@/lib/utils/logger";
import { aiCached } from "@/lib/cache/cache-decorators";

/**
 * @deprecated 使用 CoverCreativeDirector 替代
 */
export class TextAnalysisAgent {
  private readonly gemini = getGeminiProvider();
  private readonly agentLogger = logger.child({ agent: "TextAnalysisAgent" });

  @aiCached({ provider: "gemini", model: "gemini-2.5-flash", ttl: 3600 })
  async analyzeText(text: string): Promise<TextAnalysisResult> {
    this.agentLogger.info("Starting text analysis", { textLength: text.length });

    try {
      const prompt = this.buildAnalysisPrompt(text);
      const response = await this.gemini.generateText(prompt, {
        model: "gemini-2.5-flash",
        maxTokens: 1000,
        temperature: 0.3,
      });

      // 调试日志：打印 AI 原始响应
      console.log("\n[DEBUG][TextAnalyzer] Gemini 原始响应:");
      console.log("----------------------------------------");
      console.log(response);
      console.log("----------------------------------------\n");

      // Parse the structured response
      const result = this.parseAnalysisResponse(response);

      this.agentLogger.info("Text analysis completed", {
        keyPointsCount: result.keyPoints.length,
        sentiment: result.sentiment,
        topicsCount: result.topics.length,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.agentLogger.error("Text analysis failed", { error: errorMessage });
      throw new Error(`Failed to analyze text: ${errorMessage}`);
    }
  }

  private buildAnalysisPrompt(text: string): string {
    return `作为专业的内容分析师，请分析以下文本内容。请以JSON格式返回分析结果。

文本内容：
${text}

请返回以下格式的JSON：
{
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "sentiment": "positive/negative/neutral",
  "topics": ["主题1", "主题2", "主题3"],
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "简短总结（50字以内）"
}

要求：
1. 提取3-5个最重要的关键点
2. 判断文本的情感倾向
3. 识别主要主题和话题
4. 提取相关关键词
5. 生成简洁的总结`;
  }

  private parseAnalysisResponse(response: string): TextAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the response
      return {
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
        sentiment: ["positive", "negative", "neutral"].includes(parsed.sentiment)
          ? parsed.sentiment
          : "neutral",
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
        summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 200) : "",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.agentLogger.error("Failed to parse analysis response", { response, error: errorMessage });

      // Return a default result if parsing fails
      return {
        keyPoints: ["文本分析暂时失败"],
        sentiment: "neutral",
        topics: ["未分类"],
        keywords: [],
        summary: "文本内容处理中遇到问题",
      };
    }
  }
}

// Export singleton instance
export const textAnalyzer = new TextAnalysisAgent();