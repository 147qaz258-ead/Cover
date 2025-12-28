import { NextRequest, NextResponse } from 'next/server';
import { moderationService, ModerationResult } from '@/lib/moderation/moderation-service';

// Moderation configuration
export const MODERATION_CONFIG = {
  enabled: process.env.ENABLE_CONTENT_MODERATION !== 'false',
  strictMode: process.env.CONTENT_MODERATION_STRICT === 'true',
  logBlockedContent: process.env.LOG_BLOCKED_CONTENT === 'true',
  bypassKey: process.env.MODERATION_BYPASS_KEY, // For testing/admin purposes
};

export interface ModerationMiddlewareOptions {
  fields?: string[]; // Fields to moderate in the request body
  mode?: 'block' | 'warn' | 'log'; // How to handle flagged content
  bypassOnProduction?: boolean; // Whether to bypass moderation in production
}

/**
 * Middleware to apply content moderation to API routes
 */
export function withModeration(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: ModerationMiddlewareOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const {
    fields = ['text', 'content', 'title', 'description'],
    mode = 'block',
    bypassOnProduction = false,
  } = options;

  // Skip moderation if disabled
  if (!MODERATION_CONFIG.enabled) {
    return handler;
  }

  // Skip moderation in production if configured
  if (bypassOnProduction && process.env.NODE_ENV === 'production') {
    return handler;
  }

  return async (req: NextRequest) => {
    try {
      // Clone the request to read the body
      const clonedReq = req.clone();
      const body = await clonedReq.json();

      // Check for bypass key
      const bypassKey = req.headers.get('x-moderation-bypass') || body.moderationBypass;
      if (bypassKey === MODERATION_CONFIG.bypassKey) {
        // Add bypass metadata and continue
        const response = await handler(req);
        response.headers.set('x-moderation-bypassed', 'true');
        return response;
      }

      // Extract text content from specified fields
      const textsToModerate: string[] = [];
      const flaggedFields: string[] = [];

      for (const field of fields) {
        if (body[field]) {
          const text = typeof body[field] === 'string'
            ? body[field]
            : JSON.stringify(body[field]);

          if (text.trim()) {
            textsToModerate.push(text);
          }
        }
      }

      // If no content to moderate, continue
      if (textsToModerate.length === 0) {
        return handler(req);
      }

      // Moderate content
      const moderationResults = await moderationService.moderateBatch(textsToModerate);

      // Check for flagged content
      const hasFlaggedContent = moderationResults.some(result =>
        MODERATION_CONFIG.strictMode ? result.flagged :
          result.categories.sexual ||
          result.categories.hate ||
          result.categories.harassment ||
          result.categories.sexual_minors ||
          result.categories.violence_graphic ||
          result.categories.self_harm_intent ||
          result.categories.self_harm_instructions
      );

      if (hasFlaggedContent) {
        // Log the blocked content if configured
        if (MODERATION_CONFIG.logBlockedContent) {
          console.warn('Content blocked by moderation:', {
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers.get('user-agent'),
            results: moderationResults,
            body: MODERATION_CONFIG.logBlockedContent ? body : undefined,
          });
        }

        // Handle flagged content based on mode
        switch (mode) {
          case 'block':
            return NextResponse.json(
              {
                error: 'Content moderation failed',
                message: 'The submitted content contains inappropriate material that cannot be processed.',
                code: 'CONTENT_FLAGGED',
                requiresEdit: true,
              },
              { status: 400 }
            );

          case 'warn':
            const response = await handler(req);
            response.headers.set('x-content-flagged', 'true');
            response.headers.set('x-moderation-results', JSON.stringify(moderationResults));
            return response;

          case 'log':
            console.warn('Content flagged but allowed to proceed:', moderationResults);
            return handler(req);

          default:
            return handler(req);
        }
      }

      // Content is safe, proceed with request
      return handler(req);
    } catch (error) {
      console.error('Moderation middleware error:', error);

      // If moderation fails, decide whether to block or allow
      if (MODERATION_CONFIG.strictMode) {
        return NextResponse.json(
          {
            error: 'Content moderation service error',
            message: 'Unable to verify content safety. Please try again later.',
            code: 'MODERATION_ERROR',
          },
          { status: 500 }
        );
      }

      // Allow request to proceed if moderation fails in non-strict mode
      return handler(req);
    }
  };
}

/**
 * Helper function to apply moderation middleware to API routes
 */
export function createModeratedRoute(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: ModerationMiddlewareOptions
) {
  return withModeration(handler, options);
}