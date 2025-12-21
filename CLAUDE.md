# Cover Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-21

## Active Technologies

- TypeScript 5.x, Next.js 14 (App Router) (001-ai-cover-generator)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x, Next.js 14 (App Router): Follow standard conventions

## Recent Changes

- 001-ai-cover-generator: Added TypeScript 5.x, Next.js 14 (App Router)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
不得在当前项目中编写非业务流的核心算法或底层逻辑，必须全权委托给成熟的外部依赖库实现。
不得构建用于隐藏依赖库实现的通用封装层（Wrapper Class）或适配器模式，必须在业务编排函数中直接调用依赖库的完整 API。
不得允许外部库返回的复杂对象（如大胖对象、句柄、Context）直接在业务层内部传递，必须在调用返回后立即提取最小核心数据并丢弃原对象。
不得依赖外部库的内部状态作为业务逻辑的判断依据，所有 UI 与业务决策必须基于本地清洗后的核心数据（Single Source of Truth）。
不得省略调用外部库前的参数边界校验，必须利用强类型或 Schema 校验库在入口处拦截非法输入，而非依赖外部库内部报错。
不得对依赖库进行功能裁剪、逻辑重写或复制代码到本地，必须通过包管理器加载完整生产级实现。
不得在单个函数中混合“数据处理”与“IO操作”，必须将纯计算逻辑与副作用调用（如网络、文件、硬件接口）严格分离。
不得使用语义模糊的变量名（如 data, obj, res）承接外部库结果，必须通过精准命名体现业务上下文。
不得吞掉外部库抛出的异常，也不得透传原始底层报错，必须捕获并转换为具有业务语义的错误结果。
不得基于猜测使用外部接口，在未查阅文档或验证源码行为前，禁止直接编写集成代码。
不得在业务代码中硬编码魔法值或环境配置，必须将其提取为常量或配置文件以保持编排逻辑的纯粹性。
不得让胶水代码承担过多职责，单个函数仅允许负责单一流程节点的参数组装与调用调度。
不得维护复杂的中间状态机，应优先通过无状态的管道（Pipeline）方式串联外部库能力。
不得仅仅为了便利而引入未被使用的依赖库模块，生成的代码必须确保所有导入路径真实参与运行。
不得在未定义明确生命周期的情况下持有外部资源（如连接池、文件句柄），必须利用 try-finally 或 with 机制确保资源释放。