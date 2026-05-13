---
name: ntree-custom-rendering
description: NTree 自定义节点渲染使用 renderPrefix + renderLabel + renderSuffix 分开渲染，不全部塞进 renderLabel
metadata:
  type: reference
---

NTree 的自定义节点内容应使用三个独立的渲染 prop：
- `render-prefix` — 类型图标等前缀内容
- `render-label` — 节点名称文本（尽可能返回纯文本或简单 VNode）
- `render-suffix` — 操作按钮等后缀内容

NTree 原生处理这三个区域的 flex 布局，不会出现换行问题。

如果 `h()` 创建的 VNode 中的样式（如按钮 hover、间距）无法通过 scoped CSS 生效（相邻兄弟选择器 `+` 在 scoped 下对 `h()` 创建的元素不生效），需要使用非 scoped `<style>` 块来定义这些样式。
