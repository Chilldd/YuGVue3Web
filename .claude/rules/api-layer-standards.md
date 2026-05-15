# API 层规范

## 文件结构

每个业务模块一个 API 文件，类型定义与请求函数放在同一文件。

## 命名规范

| 操作 | 函数名 | HTTP 方法 |
|------|--------|-----------|
| 列表查询 | `getXxxList` | GET |
| 获取详情 | `getXxx` | GET /{id} |
| 创建 | `createXxx` | POST |
| 更新 | `updateXxx` | PUT /{id} |
| 删除 | `deleteXxx` | DELETE /{id} |
| 启用 | `activateXxx` | POST /{id}/activate |
| 禁用 | `disableXxx` | POST /{id}/disable |

## URL 路径模式

```
/api/system/{module}
/api/system/{module}/{id}
/api/system/{module}/{id}/action
/api/system/{module}/{id}/sub
```

## 类型定义规范

- 请求参数使用 `Command` 后缀
- 列表项使用 `ListItem` 后缀
- 列表结果使用 `GetXxxListResult`，含 `items` + `totalCount`
- 详情结果使用 `GetXxxResult` 或 `GetXxxDetailResult`
- 操作结果使用 `XxxResult`，无业务含义时用 `void`
- API 类型与页面无关的放在 `api/` 文件中，页面专属的放在页面目录
