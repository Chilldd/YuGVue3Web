<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { NDataTable } from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'

defineOptions({ name: 'CrudTable' })

const props = withDefaults(defineProps<{
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
  minHeight?: string
}>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50],
  minHeight: '300px',
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:page-size': [value: number]
}>()

const pagination = computed(() => ({
  page: props.page,
  pageSize: props.pageSize,
  showSizePicker: true,
  pageSizes: props.pageSizes,
}))
</script>

<template>
  <div class="crud-table">
    <div class="crud-table__toolbar">
      <div class="crud-table__toolbar-left">
        <span class="crud-table__count">共 <strong>{{ total }}</strong> 条记录</span>
        <slot name="toolbar-left" />
      </div>
      <div class="crud-table__toolbar-right">
        <slot name="toolbar-right" />
      </div>
    </div>
    <n-data-table
      :columns="columns as any"
      :data="data as any"
      :loading="loading"
      :pagination="pagination"
      :bordered="false"
      :single-line="false"
      size="small"
      :style="{ minHeight: minHeight }"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:page-size', $event)"
    />
  </div>
</template>

<style scoped>
.crud-table {
  background: var(--bg-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
}
.crud-table > :deep(.n-data-table) {
  overflow-x: auto;
}
.crud-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
}
.crud-table__toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.crud-table__toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.crud-table__count {
  font-size: 13px;
  color: var(--text-tertiary);
}
.crud-table__count strong {
  color: var(--text-secondary);
}
</style>
