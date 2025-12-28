# Project Context

## Purpose
Cover is an AI-powered cover image generator for Chinese social media platforms (Xiaohongshu, WeChat, Taobao, Douyin). The system uses multi-stage AI agent chains to process user text input and generate platform-specific, publication-ready cover posters with optimized titles and visual designs.

## Tech Stack
- **Runtime**: Node.js, Next.js 14 (App Router)
- **Language**: TypeScript 5.7 (strict mode enabled)
- **Frontend**: React 18, Tailwind CSS, shadcn/ui, Framer Motion
- **Canvas**: Fabric.js 6.9.1
- **AI Providers**: OpenAI (DALL-E, GPT-4o), Google Gemini 2.5/3 Pro, Replicate, Zhipu AI (GLM-4)
- **AI Framework**: LangChain 0.3.x
- **Storage**: AWS S3 SDK v3 (for Cloudflare R2), Local filesystem
- **Database**: Prisma ORM
- **Auth**: NextAuth v5
- **Validation**: Zod 3.24
- **State**: TanStack Query (React Query)

## Project Conventions

### Code Style

**最高原则 (Supreme Principles)**:
1. **Readability > Abstraction**: Code readability is the absolute highest priority. Only create abstractions when they significantly reduce duplication or complexity. Avoid over-engineering.
2. **Pragmatic Advanced Features**: Use advanced patterns (singleton, decorator, factory) only when there is a clear performance or architectural necessity.
3. **Explicit > Implicit**: Avoid "magic" code that hides too much logic. Explicitly define return types and properties.

**Glue Development Rules**:
1. No custom core algorithms - delegate AI, storage, canvas operations to mature libraries
2. No wrapper classes - direct library API calls in business orchestrators
3. Zero-copy integration - use libraries via package manager, never copy code locally
4. Single Source of Truth - UI/business decisions based on locally extracted data
5. Schema validation at entry - Zod validation at API boundaries
6. Separate I/O from computation - pure functions vs side effects strictly separated
7. Precise variable names - no `data`, `obj`, `res` - use business-meaningful names
8. Transform errors - catch and convert to business-semantic errors
9. No magic values - extract to constants/config
10. Single responsibility - glue code functions handle one flow node only
11. Stateless pipelines - prefer pipelines over state machines
12. Explicit resource lifecycle - use try-finally for resources

**Formatting**:
- Prettier for code formatting (`.prettierrc`)
- ESLint with TypeScript rules
- ES Module named imports for Fabric.js (not default imports)

### Architecture Patterns

**AI Pipeline (Current)**:
```
User Text → CoverCreativeDirector (Single LLM Call) → {
              analysis, titles, imagePrompt
           } → ImageGenerator → Optimized Image
```

**Image Generation Flow**:
1. ModelRegistry selects available models based on API keys and priority
2. ImageGenerationAgent.generateImage() with retry/fallback
3. Check Cache (CacheFactory) → Return if hit
4. Build Image Prompt (Designer LLM + Style Injection)
5. Generate with exponential backoff retry and fallback model support
6. Provider.generateImage() returns URL or Buffer
7. Optimize Image (WebP, resize) → Upload to Storage
8. Cache Result (30 min TTL)

**Storage Abstraction**:
```
STORAGE_MODE (env: "local" | "r2")
     ↓
StorageDriver interface
     ├─ LocalStorageDriver (fs/promises) → .local-storage/
     └─ R2StorageDriver (@aws-sdk/client-s3) → Cloudflare R2
```

### Testing Strategy
- Type checking: `npm run type-check` (tsc --noEmit)
- Linting: `npm run lint` (ESLint)
- Manual testing required for AI outputs (non-deterministic)

### Git Workflow
- Current branch: `001-ai-cover-generator`
- Main branch: (not specified, likely `main`)
- Commit format: Conventional commits (feat:, fix:, refactor:, docs:, chore:)
- Pull requests required for merging to main

## Domain Context

**Target Platforms**:
- **Xiaohongshu** (Little Red Book) - 3:4 aspect ratio, lifestyle/aesthetic focus
- **WeChat** - 2.35:1 aspect ratio, professional/clean style
- **Taobao** - 1:1 square format, product-focused
- **Douyin** (TikTok China) - 16:9 or 3:4, dynamic/engaging

**Visual Style Templates**:
- Minimalist Clean (极简风)
- Cyberpunk/Tech (赛博朋克)
- Gradient Mood (渐变氛围)
- Paper Texture (纸质复古)
- Glass Morphism (毛玻璃)
- Neon Dark (霓虹暗色)

**Image Generation Models** (priority-ordered):
- OpenAI DALL-E 3
- Flux via Laozhang API
- Gemini 2.5/3 Pro Image
- Stable Diffusion via Replicate

## Important Constraints

**Technical Constraints**:
- Must use ES Module imports for Fabric.js v6: `import { Canvas, IText, ... } from "fabric"`
- TypeScript strict mode enabled - all types must be explicit
- Next.js 14 App Router (not Pages Router)
- PSRAM-like memory considerations for image buffers (512KB+ images)

**Business Constraints**:
- API keys required for at least one AI provider
- Chinese language support mandatory for titles and prompts
- Platform-specific aspect ratios must be enforced

**API Rate Limits**:
- OpenAI: RPM/TPM limits
- Google Gemini: Quota-based
- Cache with 30 min TTL to reduce API calls

## External Dependencies

**AI APIs**:
- OpenAI API (https://api.openai.com)
- Google Gemini API (https://generativelanguage.googleapis.com)
- Replicate API (https://api.replicate.com)
- Laozhang API Relay (recommended for Flux)
- Zhipu AI (GLM-4 for CoverCreativeDirector LLM)

**Storage**:
- Cloudflare R2 (S3-compatible)
- Local filesystem (.local-storage/ directory)

**Authentication**:
- NextAuth v5 with Prisma adapter
- bcryptjs for password hashing

**Payment** (planned):
- Stripe SDK v20

**Monitoring** (planned):
- Analytics middleware
- Rate limiting middleware
