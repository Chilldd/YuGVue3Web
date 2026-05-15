# 权限规范

- 必须统一管理权限逻辑
- 禁止页面硬编码权限判断
- 禁止模板中大量 v-if 权限判断

## 权限编码命名规则

权限编码（`permissionCode`）格式为：

```
{控制器}:{方法}
```

- 控制器名和方法名均为全小写
- 使用英文冒号 `:` 分隔
- 不含空格、连字符、下划线、路径斜杠

示例：

| 控制器 | 方法 | 权限编码 |
|--------|------|----------|
| UserController | Create | `user:create` |
| RoleController | Delete | `role:delete` |
| ResourceController | Update | `resource:update` |
| ToolController | SyncApiResources | `tool:syncapiresources` |
| PermissionController | GetMenus | `permission:getmenus` |

对应后端 `Controller` 命名，取 `XxxController` 去掉 `Controller` 后缀转为小写，方法名直接转为小写。

## 权限常量管理

权限编码统一在 `src/constants/permissions.ts` 中按模块对象导出，页面通过 `import` 引入使用，禁止硬编码字符串。
