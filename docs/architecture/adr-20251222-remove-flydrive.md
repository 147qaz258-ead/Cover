# ADR-20251222: 移除 Flydrive，采用胶水式存储层

> **日期**: 2025-12-22  
> **状态**: Proposed  
> **决策者**: AI 架构顾问

---

## 上下文

项目使用 Flydrive 作为存储抽象层，支持本地存储和 Cloudflare R2。

### 问题

Flydrive 依赖 `@poppinss/utils`（AdonisJS 生态工具库），该库使用 CJS 模块格式，包含动态 `require()` 调用。在 Next.js 14 + Webpack 环境下，ESM/CJS 互操作失败，导致：

```
TypeError: r is not a function
at @poppinss/utils/build/index.js
```

此错误阻断了 `/api/generate` 端点。

---

## 决策

**移除 Flydrive，使用项目已有的原生依赖重写存储层**

- 本地存储：Node.js `fs/promises`
- R2 存储：`@aws-sdk/client-s3`（项目已安装）

---

## 理由

| 考量 | Flydrive | 胶水方案 |
|------|----------|----------|
| Next.js 兼容性 | ❌ 有问题 | ✅ 原生支持 |
| 依赖数量 | 多（flydrive + @poppinss） | 少（项目已有） |
| 代码量 | 少 | 中（~150行） |
| 维护成本 | 低 | 中 |
| 长期稳定性 | 依赖第三方 | 自主可控 |

**选择理由**：
1. 彻底消除兼容性问题
2. 减少外部依赖
3. 复用现有 AWS SDK
4. 遵循「胶水开发」原则

---

## 架构变更

### 变更前

```
src/lib/storage/
└── index.ts (依赖 flydrive)
```

### 变更后

```
src/lib/storage/
├── drivers/
│   ├── interface.ts   # 驱动接口
│   ├── local.ts       # 本地驱动 (fs)
│   └── r2.ts          # R2 驱动 (AWS SDK)
└── index.ts           # 适配器（接口不变）
```

---

## 影响

### 正面影响

- 解决 500 错误
- 减少 `node_modules` 体积
- 提升构建稳定性

### 负面影响

- 失去 Flydrive 的多后端抽象能力
- 需要自行维护驱动代码

### 缓解措施

- 保持接口不变，未来可替换回其他库
- 代码简洁，维护成本可控

---

## 替代方案

| 方案 | 描述 | 未采用原因 |
|------|------|------------|
| transpilePackages | Next.js 配置转译 | 可能无效，不彻底 |
| 动态导入 | 延迟加载 Flydrive | 增加复杂度，仍有风险 |
| Vercel Blob | Vercel 存储方案 | 平台绑定 |

---

## 验证标准

1. `npm run dev` 无模块加载错误
2. `/api/generate` 返回 200
3. 图像正确保存到 `.local-storage/`
4. 图像可通过 `/api/storage/...` 访问

---

## 相关文档

- [bugfix_plan/fix_01](../bugfix_plan/fix_01_故障综述与根因分析.md) - 故障分析
- [storage-architecture.md](storage-architecture.md) - 存储架构
- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) - 项目上下文

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | ADR 创建 |
