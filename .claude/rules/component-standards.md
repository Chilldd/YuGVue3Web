# 组件规范

## Props / Emits

所有组件必须显式定义 props 和 emits 类型：

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
}>(), {
  title: '默认标题',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()
</script>
```

## 文件命名

- 公共组件：`PascalCase.vue`，放在 `src/components/`
- 页面组件：`PascalCase.vue`，放在页面目录下
- 业务无关的组件禁止引用业务模块

## 组件职责

- 单一职责，一个组件只做一件事
- 复杂组件必须拆分为子组件
- 禁止在组件内直接调用 API（通过 composable 或 props 传递）
- 模态框表单做成独立组件（`XxxFormModal.vue`）挂载在页面中
