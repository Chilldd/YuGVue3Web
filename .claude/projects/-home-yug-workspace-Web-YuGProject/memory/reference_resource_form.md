---
name: resource-form-rules
description: 资源创建/编辑表单按类型区分字段和校验规则，父级按类型层级约束筛选
metadata:
  type: reference
---

资源表单按 `type` 分三套字段配置：

**Menu**: icon, route, component, isHidden, badge（不传 httpMethod/path/permissionCode）
**Page**: route, component, permissionCode（不传 httpMethod/path/icon/badge/isHidden；permissionCode 空时用 delete 不发送，不用空字符串）
**Api**: httpMethod（必选）, path（必选）, permissionCode（必选，格式 {模块}:{操作}）

父级筛选约束（`parentOptions` 按 type 过滤）：
- Menu → 父级只能是 Menu
- Page → 父级只能是 Menu  
- Api → 父级只能是 Page

提交时按 type 清理不生效的字段再发送。permissionCode 对 Page 不是必填，但必填时传 null 不传空字符串（数据库唯一索引约束）。
