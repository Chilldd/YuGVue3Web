# Vue 开发规范

必须使用 Composition API，禁止以下模式：

- Options API
- mixins
- 模板中复杂业务逻辑

组件要求：

- 单一职责
- 可复用
- 复杂组件必须拆分
- 业务逻辑必须抽离 composable
