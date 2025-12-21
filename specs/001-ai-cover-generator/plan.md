# Implementation Plan: AI Cover Generator

**Branch**: `001-ai-cover-generator` | **Date**: 2025-12-21 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/001-ai-cover-generator/spec.md`

## Summary

AI封面生成器，使用多阶段AI代理链处理用户文本内容，为小红书创作者、电商商家和公众号服务生成高质量、可直接发布的封面海报。系统采用胶水式开发架构，完全基于成熟开源库构建，不重复造轮子。

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 14 (App Router)
**Primary Dependencies**:
- Frontend: Next.js 14, React 18, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: Next.js API Routes (Edge-first), Cloudflare R2
- AI Services: OpenAI API, Gemini API, Nano Banana Pro, Qwen, 豆包, Replicate, OpenAI Images
**Storage**: Cloudflare R2 for images, Supabase (optional for user system)
**Testing**: Jest, React Testing Library, Playwright
**Target Platform**: Web (Vercel/Edge deployment)
**Project Type**: Full-stack web application
**Performance Goals**: <30s cover generation, handle 100 concurrent users
**Constraints**: Stateless backend, Edge-first deployment, modular replaceable components
**Scale/Scope**: MVP for NVP phase, extensible architecture for multi-service AI integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ Principle I - Mature Library First**: All technologies are established production libraries
**✅ Principle II - Zero-Copy Integration**: Using libraries as-is via package managers
**✅ Principle III - Production-Grade Dependencies Only**: All dependencies are full production versions
**✅ Principle IV - Minimal Glue Code**: Focus on orchestration between AI services and UI components
**✅ Principle V - Transparent Integration**: Direct imports with clear attribution of external functionality

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-cover-generator/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api.yml         # OpenAPI specification
│   └── ai-agents.md    # AI service contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single project with clear module boundaries
src/
├── app/                 # Next.js App Router
│   ├── (dashboard)/    # Main application routes
│   ├── api/           # API routes (backend)
│   └── globals.css
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── forms/         # Form components
│   └── covers/        # Cover-specific components
├── lib/               # Utility libraries and integrations
│   ├── ai/           # AI service integrations
│   ├── storage/      # R2/Supabase integrations
│   └── utils/        # Helper functions
└── types/            # TypeScript type definitions

tests/
├── contract/         # AI service integration tests
├── integration/      # End-to-end tests
└── unit/            # Unit tests
```

**Structure Decision**: Single Next.js project with clear module boundaries, following the glue development principle of orchestrating existing libraries rather than building custom infrastructure.

## Complexity Tracking

No violations detected - all requirements align with constitution principles of minimal glue code and mature library first approach.

---

## Phase 0: Research & Technology Selection ✅

**Completed**: 2025-12-21

**Key Decisions**:
- LangChain.js for AI agent orchestration
- shadcn/ui + Tailwind CSS for UI components
- Cloudflare R2 for image storage
- Plugin-based architecture for AI services
- Edge-first deployment strategy

**Output**: [research.md](research.md)

---

## Phase 1: Design & Contracts ✅

**Completed**: 2025-12-21

**Deliverables**:
- Data model with all entities and relationships
- OpenAPI specification for all endpoints
- AI agent contracts and provider interfaces
- Quick start guide for developers

**Outputs**:
- [data-model.md](data-model.md)
- [contracts/api.yml](contracts/api.yml)
- [contracts/ai-agents.md](contracts/ai-agents.md)
- [quickstart.md](quickstart.md)

**Constitution Check**: ✅ All principles followed
- Mature Library First: All components based on existing libraries
- Zero-Copy Integration: No copied dependencies
- Minimal Glue Code: Only orchestration logic
- Transparent Integration: Clear attribution of external dependencies

---

## Phase 2: Implementation Roadmap

**Purpose**: Prepare for task generation and implementation

### Module Breakdown

1. **AI Integration Layer** (`src/lib/ai/`)
   - Agent implementations (text, title, image generation)
   - Provider adapters (OpenAI, Gemini, Nano Banana, etc.)
   - Error handling and fallback logic

2. **API Layer** (`src/app/api/`)
   - Generation endpoint with streaming support
   - Status polling endpoint
   - Template and style endpoints
   - File upload/download handlers

3. **UI Components** (`src/components/`)
   - Cover generator form
   - Real-time progress tracking
   - Image gallery and editor
   - Template and style selectors

4. **Storage Layer** (`src/lib/storage/`)
   - R2 integration for image storage
   - CDN configuration
   - Caching strategy

### Technical Architecture

```typescript
// Main generation flow
export async function generateCovers(input: GenerateInput) {
  // 1. Analyze text with AI agent
  const analysis = await textAnalysisAgent.run(input.text);

  // 2. Generate optimized titles
  const titles = await titleAgent.run(analysis, input.platforms);

  // 3. Process each platform in parallel
  const covers = await Promise.allSettled(
    input.platforms.map(platform =>
      generateForPlatform(titles, platform, input.style)
    )
  );

  // 4. Store results and return job ID
  return await storeResults(covers);
}
```

---

**Purpose**: Validate technology choices and identify reusable open-source modules

### AI Service Integration Research

**Decision**: Use LangChain.js for AI agent orchestration
**Rationale**:
- Production-ready library with proven track record
- Supports multiple AI providers (OpenAI, Gemini, etc.)
- Built-in agent chain capabilities
- Eliminates need to implement agent pipeline from scratch

**Alternatives considered**:
- Custom implementation (violates constitution)
- Vercel AI SDK (less flexible for complex agent chains)

### UI Component Library Research

**Decision**: shadcn/ui + Tailwind CSS
**Rationale**:
- Complete production UI component library
- Built on Radix UI primitives
- Fully customizable with Tailwind
- No need to implement custom components

**Alternatives considered**:
- Material-UI (opinionated design system)
- Ant Design (heavy bundle size)

### Storage Strategy Research

**Decision**: Cloudflare R2 for image storage
**Rationale**:
- S3-compatible API, multiple client libraries available
- Edge-optimized for global performance
- No custom storage implementation needed

**Alternatives considered**:
- AWS S3 (vendor lock-in)
- Custom file storage (violates constitution)

### Modular Architecture Research

**Decision**: Plugin-based architecture for AI services
**Rationale**:
- Each AI service as independent module
- Common interface for easy swapping
- Follows constitution principle of replaceable modules

**Key Modules Identified**:
1. Text Analysis Agent (blog/article processing)
2. Title Generation Agent (structured prompt)
3. Image Generation Agent (multiple providers)
4. Layout Agent (template-based positioning)