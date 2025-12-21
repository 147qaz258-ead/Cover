<!-- Sync Impact Report:
Version change: 0.0.0 → 1.0.0 (Initial constitution creation)
Modified principles: N/A (new constitution)
Added sections: Core Principles (5), Integration Standards, Development Scope
Removed sections: N/A
Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check alignment verified)
  - ✅ .specify/templates/spec-template.md (Scope alignment verified)
  - ✅ .specify/templates/tasks-template.md (Task categorization verified)
  - ⚠️ .claude/commands/speckit.*.md (Command references to be validated)
Follow-up TODOs: None
-->

# Neural Hub Constitution
<!-- AI-Native Robot Gateway & Visualization Console -->

## Core Principles

### I. Mature Library First
Never implement底层或通用逻辑. Must优先、直接、完整复用既有成熟仓库与生产级库. All functionality MUST come from established, production-ready libraries with proven track records.

### II. Zero-Copy Integration
不得复制依赖库代码到当前项目中. 不得对依赖库进行功能裁剪、逻辑重写或降级封装. Must use libraries as-is through package managers or direct source links without modifications.

### III. Production-Grade Dependencies Only
不得使用简化版、替代版或重写版依赖. 所有依赖路径必须真实存在并指向完整仓库源码. Must ensure sys.path loads target production-grade libraries, never simplified or demo versions.

### IV. Minimal Glue Code
当前项目仅承担业务流程编排、模块组合调度、参数配置与输入输出适配职责. 不得在当前项目中重复实现算法、数据结构或复杂核心逻辑. Only generate minimal necessary glue code and business orchestration.

### V. Transparent Integration
必须直接导入完整依赖模块，不得进行子集封装或二次抽象. 在生成代码时必须明确标注哪些功能来自外部依赖. All imported modules must actively participate in execution - no "import-only" pseudo-integrations.

## Integration Standards

### Dependency Management
- 所有被调用能力必须来自依赖库的真实实现，不得使用 Mock、Stub 或 Demo 代码
- 不得存在占位实现、空逻辑或"先写接口后补实现"的情况
- 必须假设依赖库为权威且不可修改的黑箱实现
- 项目评价标准以是否正确、完整站在成熟系统之上构建为唯一依据，而非代码量

### Path Integrity
- 不得通过路径遮蔽、重名模块或隐式 fallback 加载非目标实现
- 必须确保 sys.path 或依赖注入链路加载的是目标生产级本地库
- 不得因路径配置错误导致加载到裁剪版、测试版或简化实现

## Development Scope

### Allowed Activities
- 业务流程编排 (Business flow orchestration)
- 模块组合调度 (Module composition and scheduling)
- 参数配置 (Parameter configuration)
- 输入输出适配 (Input/output adaptation)

### Prohibited Activities
- 自行实现底层或通用逻辑 (Implementing low-level or generic logic)
- 复制依赖库代码到项目中 (Copying dependency code into project)
- 实现依赖库已提供的同类功能 (Reimplementing functionality available in dependencies)
- 将依赖库中的复杂逻辑拆出后自行实现 (Extracting and reimplementing complex logic from dependencies)

## Governance

This constitution supersedes all other development practices and guidelines.

### Amendment Process
- All amendments require documentation, justification, and migration plan
- Version follows semantic versioning: MAJOR (backward-incompatible changes), MINOR (new principles), PATCH (clarifications)
- All feature specifications and implementation plans must reference and comply with this constitution

### Compliance Review
- Every PR/review must verify compliance with these principles
- Any deviation from Mature Library First principle requires explicit architectural review
- Use .specify/memory/constitution.md as the single source of truth for development guidelines

**Version**: 1.0.0 | **Ratified**: 2025-12-21 | **Last Amended**: 2025-12-21