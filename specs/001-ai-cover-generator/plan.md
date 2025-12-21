# Implementation Plan: AI Cover Generator

**Branch**: `001-ai-cover-generator` | **Date**: 2025-12-21 | **Spec**: [specs/001-ai-cover-generator/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ai-cover-generator/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Building an AI-powered cover generation platform for content creators (小红书, 电商商家, 公众号) that uses intelligent agent systems to decompose user text input and generate platform-optimized covers. The system follows glue development principles - composing existing mature libraries without reinventing functionality. Key innovation is the multi-stage AI pipeline that can handle both simple titles and full articles, automatically extracting key points and generating visually appropriate covers.

## Technical Context

**Language/Version**: TypeScript (Next.js 14 App Router)
**Primary Dependencies**:
- Frontend: React 18, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: Next.js API Routes (Edge-compatible where possible)
- AI Services: OpenAI API / Gemini (text), nano banana pro / qwen / 豆包 (images)
- Storage: Cloudflare R2 (images), Supabase (optional user system)
**Storage**: Cloudflare R2 for image storage, stateless API design
**Testing**: Vitest + Testing Library + Playwright
**Target Platform**: Web (Vercel/Edge deployment)
**Project Type**: Single full-stack web application with AI integration
**Performance Goals**: <30s generation time, Edge-optimized for global latency
**Constraints**: Stateless design, no model training, modular/replacable AI services
**Scale/Scope**: Initial MVP supporting 3 platforms (小红书9:16, 公众号2.35:1, 商品1:1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mature Library First ✅
- All dependencies are established production-ready libraries
- Next.js, React, Tailwind, shadcn/ui are mature with proven track records
- AI services via established APIs (OpenAI, etc.)

### II. Zero-Copy Integration ✅
- No copying of library code into project
- Using package managers (npm/pnpm) for all dependencies
- Direct API integration with AI services

### III. Production-Grade Dependencies Only ✅
- Using official packages and APIs, no simplified versions
- All dependencies point to complete implementations

### IV. Minimal Glue Code ✅
- Project limited to business orchestration and module composition
- AI services wrapped in adapter functions for easy replacement
- Template system for modular design iteration

### V. Transparent Integration ✅
- Direct imports of all dependencies
- Clear attribution of external functionality in code
- No "import-only" pseudo-integrations

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-cover-generator/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application with Next.js App Router
app/
├── (dashboard)/
│   ├── generate/
│   │   ├── page.tsx         # Main cover generation interface
│   │   └── components/
│   │       ├── TextInput.tsx
│   │       ├── StyleSelector.tsx
│   │       ├── PlatformSelector.tsx
│   │       └── CoverPreview.tsx
│   └── history/
│       └── page.tsx         # User generation history
├── api/
│   ├── generate/
│   │   ├── route.ts         # Main generation endpoint
│   │   └── agents/
│   │       ├── text-analysis.ts
│   │       ├── title-extraction.ts
│   │       ├── visual-concept.ts
│   │       └── image-generation.ts
│   └── templates/
│       └── route.ts         # Template management
├── lib/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── gemini.ts
│   │   │   ├── qwen.ts
│   │   │   └── doubao.ts
│   │   └── adapters/
│   │       └── ai-client.ts   # Unified AI interface
│   ├── storage/
│   │   └── r2.ts            # Cloudflare R2 integration
│   └── templates/
│       └── template-engine.ts # Template processing
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── layout/
├── types/
│   ├── ai.ts              # AI service types
│   ├── templates.ts       # Template types
│   └── platform.ts        # Platform specifications
└── styles/
    └── globals.css
```

**Structure Decision**: Next.js App Router with TypeScript, following glue development principles. All functionality achieved through composition of existing libraries - no custom implementations of core features.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations identified. All complexity is justified by business requirements and achieved through legitimate composition of mature dependencies.