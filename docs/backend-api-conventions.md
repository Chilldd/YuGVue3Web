# 后端 API 约定

## 接口定义查询

Swagger JSON：`http://localhost:5000/swagger/v1/swagger.json`
用 `python` 解析该文件获取接口定义。

## 成功响应
HTTP 2xx → Axios 默认走 `response.data`。

## 错误响应
全局拦截器 `src/api/request.ts` 按状态码统一处理：

| 状态码 | 前端处理 |
|--------|----------|
| 400 + `data.errors` | 逐字段显示校验错误（`name: 不能为空`） |
| 400 其他 | 显示 `data.message` |
| 401 | 清 token，跳登录页 |
| 403 | 提示「权限不足」 |
| 404 | 跳转 404 |
| 500 | 显示 `data.message` 或「服务器错误」 |
| 无响应 | 提示「网络连接失败」 |

> 登录/刷新接口实际返回 400 + DomainException，不返回 401。

## 分页结构
列表接口统一返回 `PageResult<T>`：
```ts
{ items: T[], totalCount: number, page: number, pageSize: number, totalPages: number }
```

## ID 序列化关键注意事项
所有 `int64` 字段（id、parentId、roleIds 等）在 JSON 中**序列化为字符串**（JS Number 无法精确表示 >2^53 的整数），前端类型需使用 `string | number` 兼容。

## Composable 错误处理
全局拦截器已接管所有错误提示，composable 的 catch 块不再调用 `message.error()`，只保留：
- `return false` / `return null`（调用方判断是否成功）
- 重试逻辑
- 状态标记（如 `treeError.value = true`）
