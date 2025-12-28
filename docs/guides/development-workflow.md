# 开发工作流指南

> 本文档描述 Cover 项目的日常开发流程与规范。

---

## 目的 Purpose

统一团队开发流程，确保代码质量与协作效率。

## 适用范围 Scope

- 日常功能开发流程
- 代码提交规范
- 质量检查清单

## 当前状态 Status

**Active** - 适用于 Cover v0.1.0

---

## 1. 开发流程概览

```
需求理解 → 分支创建 → 编码实现 → 本地验证 → 代码提交 → 合并请求
```

---

## 2. 分支策略

> [!NOTE]
> 【待确认】项目当前无 `.github/workflows/` 配置，以下为推荐策略。

```
main        ← 生产分支（保护分支）
└── dev     ← 开发分支
    ├── feature/xxx  ← 功能分支
    ├── fix/xxx      ← 修复分支
    └── refactor/xxx ← 重构分支
```

### 2.1 分支命名规范

| 类型 | 前缀 | 示例 |
|------|------|------|
| 新功能 | `feature/` | `feature/add-wechat-platform` |
| Bug 修复 | `fix/` | `fix/image-upload-timeout` |
| 重构 | `refactor/` | `refactor/pipeline-structure` |
| 文档 | `docs/` | `docs/update-api-guide` |

---

## 3. 提交规范

### 3.1 Commit Message 格式

```
<type>: <subject>

[optional body]
```

### 3.2 Type 类型

| Type | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加抖音平台支持` |
| `fix` | 修复 Bug | `fix: 修复图像上传超时问题` |
| `docs` | 文档更新 | `docs: 更新 API 文档` |
| `refactor` | 重构 | `refactor: 重构 Pipeline 结构` |
| `test` | 测试 | `test: 添加标题生成单元测试` |
| `chore` | 杂项 | `chore: 更新依赖版本` |
| `style` | 格式 | `style: 格式化代码` |

### 3.3 示例

```bash
# 正确示例
git commit -m "feat: 添加小红书竖版封面支持"
git commit -m "fix: 修复 R2 上传时的路径编码问题"
git commit -m "docs: 补充 API 错误码说明"

# 错误示例
git commit -m "update"           # ❌ 无类型、无描述
git commit -m "修复bug"          # ❌ 无类型前缀
```

---

## 4. 代码质量检查

### 4.1 提交前必须执行

```bash
# 1. ESLint 检查
npm run lint

# 2. TypeScript 类型检查
npm run type-check

# 3. 确认无构建错误
npm run build
```

### 4.2 检查清单

在提交代码前，确认以下事项：

- [ ] `npm run lint` 无错误
- [ ] `npm run type-check` 无错误
- [ ] 所有导入路径使用 `@/*` 别名
- [ ] 无硬编码魔法值
- [ ] 错误已转换为业务语义
- [ ] 新增代码有适当注释（解释"为什么"）
- [ ] 相关文档已同步更新

> **证据来源**: [CLAUDE.md](file:///d:/C_Projects/Cover/CLAUDE.md) 架构约束条款

---

## 5. 日常开发命令

### 5.1 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:3000`。

### 5.2 清理缓存重启

```bash
# PowerShell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run dev

# Bash
rm -rf .next && npm run dev
```

### 5.3 类型生成与检查

```bash
# 仅检查类型
npm run type-check

# 监视模式
npx tsc --noEmit --watch
```

---

## 6. 架构约束遵循

开发时需遵循 `CLAUDE.md` 中定义的规范：

| 约束 | 说明 |
|------|------|
| **禁止自实现算法** | 核心逻辑委托给 OpenAI/Replicate 等外部库 |
| **禁止封装层** | 直接调用依赖库 API，不构建 Wrapper |
| **立即提取数据** | 外部库返回后立即提取核心数据 |
| **分离 IO 与计算** | 纯函数与副作用分离 |
| **无状态管道** | 使用 Pipeline 串联，避免状态机 |

> **证据来源**: [CLAUDE.md](file:///d:/C_Projects/Cover/CLAUDE.md) 第 31-45 行

---

## 7. 代码审查要点

### 7.1 审查清单

- [ ] 代码逻辑正确，边界条件已处理
- [ ] 符合项目架构约束
- [ ] 命名清晰，符合命名规范
- [ ] 无重复代码，已提取复用逻辑
- [ ] 错误处理完善，无吞异常
- [ ] 性能影响已评估（如适用）

### 7.2 常见问题

| 问题 | 建议 |
|------|------|
| 过长函数 | 拆分为多个单一职责函数 |
| 嵌套过深 | 提前返回、提取函数 |
| 魔法值 | 提取为常量 |
| 重复代码 | 提取为复用函数 |

---

## 8. 环境切换

### 8.1 开发环境

```bash
# 使用 .env.local
npm run dev
```

### 8.2 生产构建测试

```bash
# 构建
npm run build

# 启动生产服务器
npm run start
```

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| 命令脚本 | `package.json` |
| 架构约束 | `CLAUDE.md` |
| ESLint 配置 | `.eslintrc.json` |
| Prettier 配置 | `.prettierrc` |

## 相关链接 Related

- [快速启动指南](getting-started.md)
- [编码规范](../standards/coding-style-guide.md)
- [命名规范](../standards/naming-conventions.md)
- [架构原则](../architecture/principles.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 初版创建，覆盖开发流程、提交规范、质量检查 |
