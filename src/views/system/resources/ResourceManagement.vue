<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { NTree, NButton, NSelect, NSpin, NEmpty, NConfigProvider, darkTheme } from 'naive-ui'
import type { TreeOption, TreeDropInfo } from 'naive-ui'
import type { ResourceTreeItem } from '@/api/system/resource'
import { deleteResource, moveResource } from '@/api/system/resource'
import { useResource } from '@/composables/useResource'
import { usePermission } from '@/composables/usePermission'
import { resource } from '@/constants/permissions'
import ResourceFormModal from './ResourceFormModal.vue'

const dialog = useDialog()
const message = useMessage()

const {
  treeData,
  treeLoading,
  fetchTree,
  flattenTree,
  toggleStatus,
} = useResource()

const { hasPermission } = usePermission()

// ---- Filters ----

const filters = ref({
  type: null as string | null,
  status: null as string | null,
})

const typeOptions = [
  { label: 'Menu', value: 'Menu' },
  { label: 'Page', value: 'Page' },
  { label: 'Api', value: 'Api' },
]
const statusOptions = [
  { label: '启用', value: 'Active' },
  { label: '禁用', value: 'Disabled' },
]

// ---- Modal state ----

const showModal = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const initialParentId = ref<string | null>(null)

// ---- Tree ----

const expandedKeys = ref<(string | number)[]>([])

function handleNodeClick(keys: (string | number)[]) {
  if (keys.length > 0) {
    const key = keys[0]
    const idx = expandedKeys.value.indexOf(key)
    if (idx >= 0) {
      expandedKeys.value = [...expandedKeys.value.slice(0, idx), ...expandedKeys.value.slice(idx + 1)]
    } else {
      expandedKeys.value = [...expandedKeys.value, key]
    }
  }
}

interface ResourceTreeOption extends TreeOption {
  _resource: ResourceTreeItem
}

function toTreeOptions(items: ResourceTreeItem[]): ResourceTreeOption[] {
  return items.map((item) => ({
    key: item.id,
    label: item.name || item.code || `#${item.id}`,
    _resource: item,
    children: item.children ? toTreeOptions(item.children) : undefined,
    isLeaf: !item.children || item.children.length === 0,
  }))
}

const treeOptions = computed<ResourceTreeOption[]>(() => toTreeOptions(treeData.value))

const flatResources = computed(() => flattenTree(treeData.value))

async function loadTree() {
  const params: { type?: string; status?: number } = {}
  if (filters.value.type) params.type = filters.value.type
  if (filters.value.status === 'Active') params.status = 0
  else if (filters.value.status === 'Disabled') params.status = 1
  await fetchTree(params)
}

function resetFilters() {
  filters.value = { type: null, status: null }
  loadTree()
}

function onSaved() {
  loadTree()
}

// ---- Actions ----

function openCreateModal() {
  isEdit.value = false
  editingId.value = null
  initialParentId.value = null
  showModal.value = true
}

function openCreateChildModal(parent: ResourceTreeItem) {
  isEdit.value = false
  editingId.value = null
  initialParentId.value = parent.id
  showModal.value = true
}

async function openEditModal(resource: ResourceTreeItem) {
  isEdit.value = true
  editingId.value = resource.id
  initialParentId.value = null
  showModal.value = true
}

function handleDelete(resource: ResourceTreeItem) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除资源「${resource.name || resource.code}」吗？其子节点也将一并删除。此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      try {
        await deleteResource(resource.id)
        message.success('删除成功')
        loadTree()
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '操作失败')
      }
    },
  })
}

function handleToggleStatus(resource: ResourceTreeItem) {
  const isActive = resource.status === 'Active'
  dialog.warning({
    title: isActive ? '确认禁用' : '确认启用',
    content: `确定要${isActive ? '禁用' : '启用'}资源「${resource.name || resource.code}」吗？`,
    positiveText: isActive ? '禁用' : '启用',
    negativeText: '取消',
    positiveButtonProps: { type: isActive ? 'warning' : 'success' },
    onPositiveClick: async () => {
      const ok = await toggleStatus(resource as Parameters<typeof toggleStatus>[0])
      if (ok) loadTree()
    },
  })
}

// ---- Drag & Drop ----

function findParent(items: ResourceTreeItem[], targetId: string): string | null {
  for (const item of items) {
    if (item.children?.some((c) => c.id === targetId)) return item.id
    if (item.children) {
      const found = findParent(item.children, targetId)
      if (found !== null) return found
    }
  }
  return null
}

function isMoveValid(dragType: string, parentType: string | null): boolean {
  switch (parentType) {
    case null: return dragType === 'Menu' || dragType === 'Page'
    case 'Menu': return dragType === 'Menu' || dragType === 'Page'
    case 'Page': return dragType === 'Api'
    case 'Api': return false
    default: return true
  }
}

async function handleDrop({ node, dragNode, dropPosition }: TreeDropInfo) {
  const dragRes = (dragNode as ResourceTreeOption)._resource
  const targetRes = (node as ResourceTreeOption)._resource
  if (!dragRes || !targetRes) return

  // Prevent self-drop
  if (dragRes.id === targetRes.id) return

  // Determine new parent
  let newParentId: string | null
  let parentType: string | null
  if (dropPosition === 'inside') {
    newParentId = targetRes.id
    parentType = targetRes.type
  } else {
    newParentId = findParent(treeData.value, targetRes.id)
    parentType = newParentId !== null ? (findInTree(treeData.value, newParentId)?.type || null) : null
  }

  // Prevent dropping onto own descendant (would create cycle)
  if (isDescendant(treeData.value, dragRes.id, targetRes.id)) {
    message.error('不能将节点移动到其自身子节点下')
    return
  }

  // No actual change
  if (dragRes.parentId === newParentId) return

  // Validate type hierarchy
  if (!isMoveValid(dragRes.type || '', parentType)) {
    message.error('父级类型不匹配，无法移动')
    return
  }

  const targetLabel = newParentId !== null
    ? `「${findInTree(treeData.value, newParentId)?.name || targetRes.name}」`
    : '根节点'

  dialog.warning({
    title: '确认移动',
    content: `确定要将「${dragRes.name}」移动到${targetLabel}下吗？`,
    positiveText: '移动',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await moveResource({ id: dragRes.id, parentId: newParentId })
        message.success('移动成功')
        loadTree()
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '操作失败')
      }
    },
  })
}

function isDescendant(items: ResourceTreeItem[], ancestorId: string, targetId: string): boolean {
  const ancestor = findInTree(items, ancestorId)
  if (!ancestor?.children) return false
  for (const child of ancestor.children) {
    if (child.id === targetId) return true
    if (isDescendant([child], child.id, targetId)) return true
  }
  return false
}

function findInTree(items: ResourceTreeItem[], id: string): ResourceTreeItem | null {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const found = findInTree(item.children, id)
      if (found) return found
    }
  }
  return null
}

// ---- Render helpers ----

const TYPE_ICONS: Record<string, string> = {
  Menu: 'M4 4h16v2H4V4zm0 4h16v12H4V8z',
  Page: 'M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z',
  Api: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
}
const TYPE_COLORS: Record<string, string> = {
  Menu: '#fbbf24',
  Page: '#60a5fa',
  Api: '#E6397C',
}

function iconSvg(path: string, color?: string) {
  return h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: color || 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [h('path', { d: path })])
}

function typeIcon(type: string | null) {
  return iconSvg(TYPE_ICONS[type || ''] || TYPE_ICONS.Page, TYPE_COLORS[type || ''])
}

function actionBtn(svgPath: string, title: string, cls: string, onClick: (e: Event) => void) {
  return h('button', { class: ['tree-action-btn', cls], title, onClick }, [iconSvg(svgPath)])
}

function nodeProps(_info: { option: TreeOption }) {
  return { style: 'padding-top:0 !important;padding-bottom:0 !important' }
}

function renderPrefix(info: { option: TreeOption }) {
  const opt = info.option as unknown as ResourceTreeOption
  return typeIcon(opt._resource.type)
}

function renderLabel(info: { option: TreeOption }) {
  const opt = info.option as unknown as ResourceTreeOption
  return opt._resource.name || '—'
}

function renderSuffix(info: { option: TreeOption }) {
  const opt = info.option as unknown as ResourceTreeOption
  const r = opt._resource

  // 虚拟节点（"其他"）不允许操作
  if (r.id === '-1') return null

  const isActive = r.status === 'Active'

  const btns = []
  if (hasPermission(resource.create)) {
    btns.push(actionBtn('M12 5v14m-7-7h14', '新增子节点', '', (e) => { e.stopPropagation(); openCreateChildModal(r) }))
  }
  if (hasPermission(resource.update)) {
    btns.push(actionBtn('M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z', '编辑', '', (e) => { e.stopPropagation(); openEditModal(r) }))
  }
  if ((isActive && hasPermission(resource.disable)) || (!isActive && hasPermission(resource.activate))) {
    btns.push(actionBtn(isActive ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M5 3l14 9-14 9z', isActive ? '禁用' : '启用', isActive ? 'action-warn' : 'action-success', (e) => { e.stopPropagation(); handleToggleStatus(r) }))
  }
  if (hasPermission(resource.delete)) {
    btns.push(actionBtn('M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2', '删除', 'action-danger', (e) => { e.stopPropagation(); handleDelete(r) }))
  }
  return h('span', { class: 'tree-node__actions' }, btns)
}

onMounted(loadTree)
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <div class="resource-page">
      <!-- Header -->
      <div class="resource-page__header">
        <div>
          <h1 class="resource-page__title">资源管理</h1>
          <p class="resource-page__desc">以树形结构维护系统中的菜单、页面和接口资源</p>
        </div>
        <div class="resource-page__actions">
          <n-button quaternary size="small" :loading="treeLoading" @click="loadTree">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" @click="openCreateModal" v-if="hasPermission(resource.create)">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </template>
            新建资源
          </n-button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-item">
            <label class="filter-label">类型</label>
            <n-select v-model:value="filters.type" :options="typeOptions" placeholder="全部" clearable />
          </div>
          <div class="filter-item">
            <label class="filter-label">状态</label>
            <n-select v-model:value="filters.status" :options="statusOptions" placeholder="全部" clearable />
          </div>
          <div class="filter-actions">
            <n-button type="primary" size="small" @click="loadTree">查询</n-button>
            <n-button size="small" @click="resetFilters">重置</n-button>
          </div>
        </div>
      </div>

      <!-- Tree Card -->
      <div class="tree-card">
        <div class="tree-card__hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>「其他」下的为未归属 API，可拖拽到对应页面下进行权限配置</span>
        </div>
        <n-spin :show="treeLoading">
          <n-tree
            v-if="treeOptions.length > 0"
            v-model:expanded-keys="expandedKeys"
            :data="treeOptions"
            selectable
            :selected-keys="[]"
            :render-prefix="renderPrefix"
            :render-label="renderLabel"
            :render-suffix="renderSuffix"
            :node-props="nodeProps"
            :draggable="true"
            :animated="true"
            :indent="20"
            @drop="handleDrop"
            @update:selected-keys="handleNodeClick"
          />
          <n-empty v-else-if="!treeLoading" description="暂无资源数据" />
        </n-spin>
      </div>

      <!-- Modal -->
      <ResourceFormModal
        v-model:visible="showModal"
        :is-edit="isEdit"
        :editing-id="editingId"
        :initial-parent-id="initialParentId"
        :parent-resources="flatResources"
        @saved="onSaved"
      />
    </div>
  </n-config-provider>
</template>

<style scoped>
.resource-page {
  min-height: 100%;
  padding: 4px;
}

.resource-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.resource-page__title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.resource-page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}
.resource-page__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ---- Tree Card ---- */
.tree-card {
  background: var(--bg-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 8px;
  min-height: 200px;
}

.tree-card__hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 6px 12px;
  margin-bottom: 8px;
  background: rgba(230, 57, 124, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(230, 57, 124, 0.1);
}
.tree-card__hint svg {
  flex-shrink: 0;
  color: var(--brand-pink);
  opacity: 0.7;
}

/* Override NTree node spacing */
.tree-card :deep(.n-tree-node) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.tree-card :deep(.n-tree-node-content) {
  min-height: 26px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .resource-page__header { flex-direction: column; }
}
</style>

<style>
.tree-node__actions {
  display: inline-flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.tree-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-quaternary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.tree-action-btn svg {
  width: 14px;
  height: 14px;
}
.tree-action-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-glass-hover);
}
.tree-action-btn.action-warn { color: var(--action-warn); }
.tree-action-btn.action-warn:hover { background: rgba(251, 191, 36, 0.12); }
.tree-action-btn.action-success { color: var(--status-active); }
.tree-action-btn.action-success:hover { background: rgba(52, 211, 153, 0.12); }
.tree-action-btn.action-danger { color: var(--action-danger); }
.tree-action-btn.action-danger:hover { background: rgba(248, 113, 113, 0.12); }

/* Spacing between text label and action buttons */
.n-tree-node-content__suffix {
  padding-left: 10px;
}
.n-tree-node:hover .tree-node__actions {
  opacity: 1;
}
</style>
