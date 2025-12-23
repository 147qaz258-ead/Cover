/**
 * @deprecated 此文件已废弃 (2025-12-23)
 * 
 * 标题生成功能已合并到 CoverCreativeDirector Agent 中。
 * 新架构通过单次 LLM 调用完成文本分析、标题生成和图片提示词生成。
 * 
 * @see cover-creative-director.ts
 */

import { GeneratedTitle } from "@/types";
import type { TextAnalysisResult } from "@/types";
import { getGeminiProvider } from "@/lib/ai/providers";
import { getPlatform } from "@/lib/platforms/specs";
import { logger } from "@/lib/utils/logger";
import { aiCached } from "@/lib/cache/cache-decorators";

/**
 * @deprecated 使用 CoverCreativeDirector 替代
 */
export class TitleGenerationAgent {
  private readonly gemini = getGeminiProvider();
  private readonly agentLogger = logger.child({ agent: "TitleGenerationAgent" });

  @aiCached({ provider: "gemini", model: "gemini-2.5-flash", ttl: 3600 })
  async generateTitles(
    text: string,
    analysis: TextAnalysisResult,
    platformId: string,
    count: number = 5
  ): Promise<GeneratedTitle[]> {
    this.agentLogger.info("Starting title generation", {
      platformId,
      count,
      textLength: text.length,
    });

    try {
      const platform = getPlatform(platformId);
      if (!platform) {
        throw new Error(`Unknown platform: ${platformId}`);
      }

      const prompt = this.buildTitlePrompt(text, analysis, platform);
      const response = await this.gemini.generateText(prompt, {
        model: "gemini-2.5-flash",
        maxTokens: 800,
        temperature: 0.7,
      });

      // 调试日志：打印 AI 原始响应
      console.log("\n[DEBUG][TitleGenerator] Gemini 原始响应:");
      console.log("----------------------------------------");
      console.log(response);
      console.log("----------------------------------------\n");

      const titles = this.parseTitlesResponse(response, platformId);

      this.agentLogger.info("Title generation completed", {
        titlesCount: titles.length,
        platformId,
      });

      return titles.slice(0, count);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.agentLogger.error("Title generation failed", {
        error: errorMessage,
        platformId,
      });
      throw new Error(`Failed to generate titles: ${errorMessage}`);
    }
  }

  private buildTitlePrompt(
    text: string,
    analysis: TextAnalysisResult,
    platform: any
  ): string {
    const platformGuidelines = this.getPlatformGuidelines(platform.id);

    return `作为专业的社交媒体文案专家，请为${platform.name}平台生成吸引人的标题。

平台信息：
- 平台：${platform.name}
- 尺寸：${platform.dimensions.width}x${platform.dimensions.height}
- 建议：${platformGuidelines}

文本内容：
${text}

分析结果：
- 关键点：${analysis.keyPoints.join(", ")}
- 情感倾向：${analysis.sentiment}
- 主题：${analysis.topics.join(", ")}
- 关键词：${analysis.keywords.join(", ")}

请返回以下格式的JSON：
{
  "titles": [
    {
      "text": "标题1",
      "confidence": 0.9
    },
    {
      "text": "标题2",
      "confidence": 0.8
    }
  ]
}

要求：
1. 生成3-5个不同风格的标题
2. 标题要符合${platform.name}平台的特色
3. 标题要吸引人且易于传播
4. 每个标题评估其吸引力（confidence 0-1）
5. 标题长度控制在20字以内`;
  }

  private getPlatformGuidelines(platformId: string): string {
    const guidelines: Record<string, string> = {
      xiaohongshu: "小红书风格：亲切分享、种草推荐、emoji表情、数字亮点",
      "xiaohongshu-vertical": "小红书竖版：垂直构图、重点突出、视觉冲击力强",
      wechat: "微信公众号：专业严谨、价值输出、深度内容",
      "wechat-banner": "公众号头图：简洁大气、品牌调性、视觉层次",
      taobao: "淘宝：促销导向、转化率优先、突出卖点",
      "taobao-banner": "淘宝横版：产品展示、促销信息、品牌形象",
      douyin: "抖音：短平快、节奏感强、热点追踪",
      weibo: "微博：话题性、互动性、时效性强",
      bilibili: "B站：年轻化、二次元、专业深度",
      zhihu: "知乎：专业性、知识性、逻辑性强",
    };

    return guidelines[platformId] || "通用社交媒体：简洁明了、吸引眼球、易于传播";
  }

  private parseTitlesResponse(response: string, platformId: string): GeneratedTitle[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const titles = parsed.titles || [];

      // Validate and sanitize the titles
      return titles
        .filter((t: any) => typeof t.text === "string" && t.text.length > 0)
        .map((t: any) => ({
          text: t.text.slice(0, 50), // Limit to 50 characters
          confidence: Math.min(1, Math.max(0, t.confidence || 0.5)),
          platform: platformId,
        }))
        .sort((a: GeneratedTitle, b: GeneratedTitle) => b.confidence - a.confidence);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.agentLogger.error("Failed to parse titles response", { response, error: errorMessage });

      // Return fallback titles if parsing fails
      return [
        {
          text: "AI生成封面标题",
          confidence: 0.5,
          platform: platformId,
        },
      ];
    }
  }
}

// Export singleton instance
export const titleGenerator = new TitleGenerationAgent();