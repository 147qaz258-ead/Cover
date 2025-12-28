# ADR-20251222: 本地存储扩展

> 架构决策记录 (Architecture Decision Record)

---

## 状态 Status

**Proposed** - 待实现

## 上下文 Context

Cover 项目当前仅支持 Cloudflare R2 作为图像存储后端。开发环境需要配置 R2 才能正常使用，增加了开发门槛。

**现有问题**：
1. 开发者必须配置 R2 密钥才能测试图像生成功能
2. `ImageGenerationAgent.saveImageToR2()` 方法名硬编码耦合 R2
3. 无法在离线环境开发

## 决策 Decision

引入**存储适配层**，支持多存储后端切换：

1. 创建 `StorageProvider` 接口规范
2. 实现 `LocalStorageProvider` 本地存储
3. 保留 `R2StorageProvider` 云存储
4. 通过 `STORAGE_MODE` 环境变量切换

## 后果 Consequences

### 正面影响

| 影响 | 说明 |
|------|------|
| **零配置开发** | 无需 R2 密钥即可运行 |
| **离线可用** | 支持无网络环境开发 |
| **易于扩展** | 新增存储后端只需实现接口 |
| **测试友好** | 可 Mock 存储层进行单元测试 |

### 负面影响

| 影响 | 说明 | 缓解措施 |
|------|------|----------|
| 额外抽象层 | 增加代码复杂度 | 保持接口极简 |
| 本地/云行为差异 | URL 格式不同 | 文档说明 |
| Serverless 不兼容 | 本地存储无法在 Vercel 使用 | 默认检测环境 |

## 相关决策

- [ADR-20251222: 模型可扩展性](adr-20251222-model-extensibility.md)
- [ADR-20251222: 技术栈选型](adr-20251222-tech-stack.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 初版创建 |
