# Canvas 模块文档

> **模块位置**：`src/lib/canvas/`  
> **最后更新**：2025-12-22

---

## 模块概述

Canvas 模块负责画布上的图形渲染、文本编辑和导出功能。基于 **Fabric.js v6** 构建。

---

## 文件结构

```text
src/lib/canvas/
├── text-positioning.ts   # 文本定位管理器（拖拽、缩放、旋转）
└── export.ts             # 画布导出管理器（PNG/JPG/WebP/SVG）
```

---

## 核心类

### TextPositioningManager

管理画布上文本元素的增删改查与交互行为。

**导入方式**（Fabric.js v6 ES Module）：
```typescript
import { Canvas, IText, FabricObject, Shadow, BasicTransformEvent, TPointerEvent, ModifiedEvent } from "fabric";
```

**主要功能**：
- `addText(element)` - 添加文本元素
- `updateText(id, updates)` - 更新文本属性
- `removeText(id)` - 删除文本
- `selectText(id)` - 选中文本
- `getAllTexts()` - 获取所有文本元素
- `loadFromJSON(json)` / `exportToJSON()` - 序列化/反序列化

**配置选项**：
```typescript
interface DragAndDropOptions {
  snapToGrid?: boolean;      // 是否启用网格吸附
  gridSize?: number;         // 网格大小（默认 10）
  showBoundingBox?: boolean; // 是否显示边界框
  lockAspectRatio?: boolean; // 是否锁定宽高比
  constrainToCanvas?: boolean; // 是否限制在画布内
  multiSelect?: boolean;     // 是否启用多选
}
```

---

### CanvasExporter

管理画布内容的导出功能。

**导入方式**：
```typescript
import { Canvas } from "fabric";
```

**主要功能**：
- `export(options)` - 导出为 PNG/JPG/WebP/SVG
- `exportForPlatform(platform)` - 针对特定平台优化导出
- `exportMultipleResolutions(resolutions)` - 多分辨率导出
- `generateThumbnail(size)` - 生成缩略图
- `download(result, filename)` - 触发下载

---

## Fabric.js v6 迁移说明

本模块已从 Fabric.js v4/v5 迁移到 **v6**，主要变更：

| 旧版 (v5) | 新版 (v6) |
|-----------|-----------|
| `import { fabric } from "fabric"` | `import { Canvas, IText, ... } from "fabric"` |
| `fabric.Canvas` | `Canvas` |
| `fabric.Object` | `FabricObject` |
| `fabric.Image` | `FabricImage` |
| `fabric.IEvent` | `BasicTransformEvent<TPointerEvent>` |
| `Image.fromURL(url, callback)` | `FabricImage.fromURL(url).then(...)` |
| `obj.clone(callback)` | `await obj.clone()` |

**注意**：
- Fabric.js v6 自带 TypeScript 类型定义，**不需要** `@types/fabric`
- 事件回调中通过 `e.transform?.target` 访问目标对象

---

## 相关文档

- [Fabric.js v6 迁移指南](./Fabric.js_v6_迁移指南.md) - 官方迁移文档本地副本
