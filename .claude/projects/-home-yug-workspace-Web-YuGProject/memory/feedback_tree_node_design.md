---
name: tree-node-minimal-content
description: 树节点只展示名称和类型图标，不展示 code/method/path/status 等额外信息
metadata:
  type: feedback
---

树节点内容只保留类型图标 + 名称，不展示 code、HTTP method、path、status badge 等额外信息。

**Why:** 用户反馈内容太多导致拥挤，只需要名称和类型图标即可识别。

**How to apply:** 渲染树节点时用 renderPrefix（类型图标）+ renderLabel（名称），不添加额外的文字标签和状态标记。操作按钮用 renderSuffix 放在右侧，悬停时显示。

**相关经验：** NTree 的自定义渲染使用三个分离的 render 函数，见 [[ntree-custom-rendering]]。
