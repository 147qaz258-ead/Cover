# Redis 参考

> 本文档为归档参考资料，当前 Cover 项目未使用 Redis，待未来引入缓存时参考。

---

## 1. 概念说明

Redis 是高性能的内存数据存储，常用于缓存、会话管理和实时计数。

### 1.1 主要用途

| 用途 | 说明 |
|------|------|
| 缓存 | 缓存数据库查询结果，提升读性能 |
| 会话存储 | 存储用户 Session，支持分布式 |
| 限流计数 | 实现 API 请求频率限制 |
| 分布式锁 | 防止并发资源冲突 |
| 消息队列 | 简单的发布/订阅模式 |

---

## 2. Cover 项目潜在应用场景

### 2.1 任务状态缓存

当前使用内存 Map 存储任务状态：

```typescript
// 当前实现 (src/app/api/generate/route.ts)
const jobs = new Map();
```

未来可替换为 Redis：

```typescript
// 未来可能的 Redis 实现
await redis.set(`job:${jobId}`, JSON.stringify(job));
const job = JSON.parse(await redis.get(`job:${jobId}`));
```

### 2.2 请求限流

当前使用内存实现限流：

```typescript
// 当前实现 (src/lib/api/response.ts)
const requests = (global as any)._rateLimitRequests || {};
```

未来可使用 Redis 滑动窗口：

```typescript
// 未来可能的 Redis 限流
await redis.zremrangebyscore(`rate:${ip}`, 0, windowStart);
const count = await redis.zcard(`rate:${ip}`);
```

---

## 3. 引入时机

- 需要跨进程/跨实例共享状态
- 需要持久化任务状态
- 需要更精确的限流控制
- 部署多个 Next.js 实例

---

## 4. 参考资料

- [Redis 官方文档](https://redis.io/docs/)
- [Upstash Redis](https://upstash.com/) - Serverless Redis 服务

---

*归档时间: 2025-12-22*
