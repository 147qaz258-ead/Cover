# Fabric.js v6 迁移指南

> **来源**：[官方文档 - Upgrading to Fabric.js 6.0](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-60/)  
> **本地副本创建时间**：2025-12-22

---

## 1. TypeScript 重写

Fabric.js v6 已完全使用 TypeScript 重写，**自带类型定义**。

```bash
# 如果之前安装了 @types/fabric，必须卸载
npm uninstall @types/fabric
```

---

## 2. 导入方式变更

### 2.1 旧版导入（❌ 已废弃）

```typescript
import { fabric } from "fabric";

const canvas = new fabric.Canvas("c");
const rect = new fabric.Rect({ width: 100 });
```

### 2.2 新版导入（✅ 推荐）

```typescript
import { Canvas, Rect } from "fabric";

const canvas = new Canvas("c");
const rect = new Rect({ width: 100 });
```

### 2.3 Node.js 环境

```typescript
import { StaticCanvas, Rect } from "fabric/node";
```

---

## 3. 类名重命名

为避免与 JavaScript 保留字冲突，部分类名已更改：

| 旧名称 (v5) | 新名称 (v6) |
|-------------|-------------|
| `fabric.Object` | `FabricObject` |
| `fabric.Text` | `FabricText` |
| `fabric.Image` | `FabricImage` |

---

## 4. 回调改为 Promise

所有接受回调的 API 现在返回 Promise：

### 4.1 旧版（回调）

```typescript
fabric.Image.fromURL(url, (img) => {
  canvas.add(img);
});

obj.clone((cloned) => {
  canvas.add(cloned);
});
```

### 4.2 新版（Promise）

```typescript
FabricImage.fromURL(url).then((img) => {
  canvas.add(img);
});

// 或使用 async/await
const img = await FabricImage.fromURL(url);
canvas.add(img);

const cloned = await obj.clone();
canvas.add(cloned);
```

---

## 5. 方法链已废弃

```typescript
// ❌ 不要这样写
myRect.set({ fill: "red" }).rotate(90);

// ✅ 应该这样写
myRect.set({ fill: "red" });
myRect.rotate(90);
```

---

## 6. 类与原型

### 6.1 旧版（原型修改）

```typescript
fabric.Object.prototype.originX = "center";
```

### 6.2 新版（静态默认值）

v6 使用 ES6 原生类，不再支持原型修改。每个类都有一个可变的静态 `ownDefaults` 对象：

```typescript
import { FabricObject } from "fabric";

// 修改默认值
FabricObject.ownDefaults.originX = "center";
```

---

## 7. 事件类型

v6 提供了完整的事件类型定义：

```typescript
import { Canvas, TPointerEvent, TPointerEventInfo } from "fabric";

const canvas = new Canvas("c");

canvas.on("mouse:down", (e: TPointerEventInfo<TPointerEvent>) => {
  console.log(e.target);
});
```

---

## 8. 常见迁移模式

### 8.1 Canvas 创建

```typescript
// v5
const canvas = new fabric.Canvas(canvasRef.current, { ... });

// v6
import { Canvas } from "fabric";
const canvas = new Canvas(canvasRef.current, { ... });
```

### 8.2 IText 创建

```typescript
// v5
const text = new fabric.IText("Hello", { ... });

// v6
import { IText } from "fabric";
const text = new IText("Hello", { ... });
```

### 8.3 图片加载

```typescript
// v5
fabric.Image.fromURL(url, (img) => {
  canvas.add(img);
});

// v6
import { FabricImage } from "fabric";
const img = await FabricImage.fromURL(url);
canvas.add(img);
```

### 8.4 对象克隆

```typescript
// v5
obj.clone((cloned) => {
  canvas.add(cloned);
});

// v6
const cloned = await obj.clone();
canvas.add(cloned);
```

---

## 9. 详细变更列表

完整的破坏性变更列表请参考：
- [GitHub Issue #8299](https://github.com/fabricjs/fabric.js/issues/8299)

---

## 10. 本项目迁移清单

需要迁移的文件：
1. `src/lib/canvas/text-positioning.ts`
2. `src/lib/canvas/export.ts`
3. `src/components/covers/infinite-canvas.tsx`
4. `src/components/covers/property-panel.tsx`

关键变更点：
- 移除 `import { fabric } from "fabric"`
- 使用具名导入：`import { Canvas, IText, FabricImage, ... } from "fabric"`
- 将 `fabric.Image.fromURL(url, callback)` 改为 `await FabricImage.fromURL(url)`
- 为事件回调添加类型标注
