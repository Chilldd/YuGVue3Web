<script setup lang="ts">
import { ref, watch, h } from 'vue'
import { NModal, NTree, NButton, NSpin, NEmpty } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { getResourceTree } from '@/api/system/resource'
import type { ResourceTreeItem } from '@/api/system/resource'
import { useRole } from '@/composables/useRole'

const { getDetail, saveResources } = useRole()

const props = withDefaults(defineProps<{
  visible: boolean
  roleId?: string | null
  roleName?: string
}>(), {
  roleId: null,
  roleName: '',
})

const emit = defineEmits<{
  'update:visible': [v: boolean]
  saved: []
}>()

const submitting = ref(false)
const treeLoading = ref(false)
const treeData = ref<TreeOption[]>([])
const checkedKeys = ref<(string | number)[]>([])

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

interface ResourceTreeOption extends TreeOption {
  _resource: ResourceTreeItem
}

function convertToTreeOptions(items: ResourceTreeItem[]): ResourceTreeOption[] {
  return items
    .filter(item => item.id !== '-1')
    .map(item => ({
      key: item.id,
      label: item.name || item.code || `#${item.id}`,
      _resource: item,
      children: item.children && item.children.length > 0
        ? convertToTreeOptions(item.children)
        : undefined,
    }))
}

function renderPrefix(info: { option: TreeOption }) {
  const opt = info.option as ResourceTreeOption
  return typeIcon(opt._resource.type)
}

/** 收集 Page 下的一级子节点 id（Api 只有一级） */
function collectChildIds(item: ResourceTreeItem): string[] {
  return item.children?.map((c) => c.id) ?? []
}

function renderSuffix(info: { option: TreeOption }) {
  const opt = info.option as ResourceTreeOption
  if (opt._resource.type !== 'Page') return null

  const childIds = collectChildIds(opt._resource)
  const allSelected = childIds.length > 0 && childIds.every((id) => checkedKeys.value.includes(id))

  function handleSelectAll(e: Event) {
    e.stopPropagation()
    if (allSelected) {
      checkedKeys.value = checkedKeys.value.filter((id) => !childIds.includes(id as string))
    } else {
      checkedKeys.value = [...new Set([...checkedKeys.value, ...childIds])]
    }
  }

  return h('span', { class: 'tree-suffix' }, [
    h(
      NButton,
      {
        text: true,
        type: 'primary',
        size: 'tiny',
        onClick: handleSelectAll,
      },
      { default: () => allSelected ? '取消全选' : '全选子节点' },
    ),
  ])
}

async function loadResources() {
  treeLoading.value = true
  try {
    const res = await getResourceTree()
    treeData.value = convertToTreeOptions(res.items || [])
  } catch {
    treeData.value = []
  } finally {
    treeLoading.value = false
  }
}

async function loadRoleResources(roleId: string) {
  const detail = await getDetail(roleId)
  if (detail?.resourceIds) {
    checkedKeys.value = detail.resourceIds
  }
}

async function handleSubmit() {
  if (!props.roleId) return
  submitting.value = true
  try {
    const ok = await saveResources(props.roleId, checkedKeys.value as string[])
    if (ok) {
      emit('update:visible', false)
      emit('saved')
    }
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

watch(() => props.visible, (v) => {
  if (v && props.roleId) {
    checkedKeys.value = []
    treeData.value = []
    loadResources()
    loadRoleResources(props.roleId)
  }
})
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    title="分配资源"
    :bordered="false"
    :segmented="{ content: true, footer: true }"
    style="width:640px"
    @update:show="handleClose"
  >
    <p class="resource-modal__hint">
      为角色「{{ roleName }}」分配资源权限，已选 {{ checkedKeys.length }} 项
    </p>

    <div class="resource-modal__tree">
      <n-spin :show="treeLoading">
        <n-empty v-if="!treeLoading && treeData.length === 0" description="暂无资源" />
        <n-tree
          v-else
          :data="treeData"
          :checked-keys="checkedKeys"
          :render-prefix="renderPrefix"
          :render-suffix="renderSuffix"
          checkable
          check-strategy="all"
          @update:checked-keys="checkedKeys = $event"
        />
      </n-spin>
    </div>

    <template #footer>
      <div class="resource-modal__footer">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">
          保存分配
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.resource-modal__hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 16px;
}
.resource-modal__tree {
  max-height: 480px;
  overflow-y: auto;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px;
}
.resource-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style>
.tree-suffix {
  opacity: 0;
  transition: opacity 0.15s ease;
  margin-left: 8px;
}
.n-tree-node:hover .tree-suffix {
  opacity: 1;
}
</style>
