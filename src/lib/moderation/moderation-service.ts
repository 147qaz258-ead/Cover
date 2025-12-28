import OpenAI from 'openai';
import { z } from 'zod';

// Moderation result schema
export const ModerationResultSchema = z.object({
  flagged: z.boolean(),
  categories: z.object({
    sexual: z.boolean(),
    hate: z.boolean(),
    harassment: z.boolean(),
    self_harm: z.boolean(),
    sexual_minors: z.boolean(),
    hate_threatening: z.boolean(),
    violence_graphic: z.boolean(),
    self_harm_intent: z.boolean(),
    self_harm_instructions: z.boolean(),
    harassment_threatening: z.boolean(),
    violence: z.boolean(),
  }),
  category_scores: z.record(z.number()),
  reason: z.string().optional(),
});

export type ModerationResult = z.infer<typeof ModerationResultSchema>;

// Content moderation service
export class ModerationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Moderate text content using OpenAI's Moderation API
   */
  async moderateText(text: string): Promise<ModerationResult> {
    try {
      const response = await this.openai.moderations.create({
        input: text,
        model: "text-moderation-latest",
      });

      const result = response.results[0];

      return {
        flagged: result.flagged,
        categories: {
          sexual: result.categories.sexual,
          hate: result.categories.hate,
          harassment: result.categories.harassment,
          self_harm: result.categories["self-harm"],
          sexual_minors: result.categories["sexual/minors"],
          hate_threatening: result.categories["hate/threatening"],
          violence_graphic: result.categories["violence/graphic"],
          self_harm_intent: result.categories["self-harm/intent"],
          self_harm_instructions: result.categories["self-harm/instructions"],
          harassment_threatening: result.categories["harassment/threatening"] || false,
          violence: result.categories.violence,
        },
        category_scores: {
          sexual: result.category_scores.sexual,
          hate: result.category_scores.hate,
          harassment: result.category_scores.harassment,
          self_harm: result.category_scores["self-harm"],
          sexual_minors: result.category_scores["sexual/minors"],
          hate_threatening: result.category_scores["hate/threatening"],
          violence_graphic: result.category_scores["violence/graphic"],
          self_harm_intent: result.category_scores["self-harm/intent"],
          self_harm_instructions: result.category_scores["self-harm/instructions"],
          harassment_threatening: result.category_scores["harassment/threatening"] || 0,
          violence: result.category_scores.violence,
        },
      };
    } catch (error) {
      console.error('Content moderation error:', error);

      // If moderation API fails, we err on the side of safety
      return {
        flagged: true,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          self_harm: false,
          sexual_minors: false,
          hate_threatening: false,
          violence_graphic: false,
          self_harm_intent: false,
          self_harm_instructions: false,
          harassment_threatening: false,
          violence: false,
        },
        category_scores: {},
        reason: 'Moderation service unavailable - content blocked for safety',
      };
    }
  }

  /**
   * Check if content is safe for processing
   */
  async isContentSafe(text: string): Promise<{ safe: boolean; reason?: string }> {
    const result = await this.moderateText(text);

    if (result.flagged) {
      // Find the primary reason for flagging
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      return {
        safe: false,
        reason: `Content flagged for: ${flaggedCategories.join(', ')}. ${result.reason || ''}`.trim(),
      };
    }

    return { safe: true };
  }

  /**
   * Batch moderate multiple pieces of content
   */
  async moderateBatch(texts: string[]): Promise<ModerationResult[]> {
    const results = await Promise.allSettled(
      texts.map(text => this.moderateText(text))
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error('Batch moderation error:', result.reason);
        return {
          flagged: true,
          categories: {
            sexual: false,
            hate: false,
            harassment: false,
            self_harm: false,
            sexual_minors: false,
            hate_threatening: false,
            violence_graphic: false,
            self_harm_intent: false,
            self_harm_instructions: false,
            harassment_threatening: false,
            violence: false,
          },
          category_scores: {},
          reason: 'Moderation failed - content blocked for safety',
        };
      }
    });
  }

  /**
   * Generate safe alternatives for flagged content
   */
  async generateSafeAlternative(originalText: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a content moderator. Rewrite the following text to make it appropriate for all audiences while preserving the original meaning as much as possible. Do not include harmful, offensive, or inappropriate content."
          },
          {
            role: "user",
            content: originalText
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const alternative = response.choices[0]?.message?.content;

      if (!alternative) {
        throw new Error('Failed to generate alternative');
      }

      // Verify the alternative is safe
      const moderationResult = await this.moderateText(alternative);

      if (moderationResult.flagged) {
        throw new Error('Generated alternative is still flagged');
      }

      return alternative;
    } catch (error) {
      console.error('Failed to generate safe alternative:', error);
      return originalText; // Return original if alternative fails
    }
  }
}

// Singleton instance
export const moderationService = new ModerationService();

// Export default for convenience
export default moderationService;