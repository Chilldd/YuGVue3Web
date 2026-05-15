# 后端

接口定义与 API 约定详见 [docs/backend-api-conventions.md](docs/backend-api-conventions.md)

# 技术栈约束

统一使用 Vue 3（Composition API + `<script setup>`）、TypeScript、Vite、Pinia、Naive UI、Axios。

禁止 Options API、mixins、JavaScript 文件、jQuery。

# TypeScript 规范

- 必须完整类型定义，禁止 `any`、`ts-ignore`、滥用 `unknown`
- API 返回必须统一结构化管理

# 命名规范

- `.vue` 文件：PascalCase
- `.ts` 文件：kebab-case
- 变量 / 函数：camelCase
- 常量 / 枚举值：UPPER_SNAKE_CASE
- 组件名：PascalCase，使用 `defineOptions({ name: 'Xxx' })` 声明

# Import 规范

- 统一使用 `@/` 路径别名，禁止相对路径引用（`../../xxx`）
- composable 统一从 `@/composables/useXxx` 导入

# 日志规范

生产环境禁止 `console.log`、`debugger`。

# AI 生成代码规范

## 优先级原则
1. 优先复用已有实现 / 组件 / composable / 类型
2. 保持现有架构一致

## 修改原则
- 最小变更范围，不修改无关代码，不破坏结构

# 严格禁止

- 组件内直接请求接口
- 使用 `any` 类型
- 超大单文件组件、多职责组件
- 模板复杂逻辑、魔法数字
- 重复 API 调用、直接修改 props
- 无确认框的删除/启用/禁用操作
- 无类型 API

# 提交前检查

- 类型完整、无 lint 问题
- 无冗余 import、无重复逻辑
- 命名一致、组件职责单一
- API 类型完整、composable 可复用# 参考文档（docs/）

以下为按需查阅的文档：

- [后端 API 约定](docs/backend-api-conventions.md)
- [状态管理（Pinia）](docs/pinia-standards.md)
- [权限规范](docs/permission-standards.md)
- [表格页面规范](docs/table-page-standards.md)
- [表单规范](docs/form-standards.md)
- [样式规范](docs/style-standards.md)
- [性能规范](docs/performance-standards.md)
