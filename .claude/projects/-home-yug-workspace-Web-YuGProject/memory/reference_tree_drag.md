---
name: tree-drag-move
description: 资源树节点拖拽移动实现方案
metadata:
  type: reference
---

资源树节点移动通过 NTree 的 `draggable` + `@drop` 实现：

1. NTree 加 `:draggable="true"` 和 `@drop="handleDrop"`
2. `TreeDropInfo` 中 `dropPosition` 为 `'inside'` 表示拖入节点内部（新父级=目标节点），`'before'` / `'after'` 表示插入前后（新父级=目标节点的父级）
3. 拖拽后二次确认弹窗，确认后调用 `moveResource API (PUT /api/management/resources/{id}/move, body: { id, parentId })`
4. 校验：不能拖到自身子节点下、不能拖到类型不兼容的父级下、不能拖到自己身上
