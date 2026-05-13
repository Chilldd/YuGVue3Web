<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NTree, NButton, NSpin, NEmpty, NTabs, NTabPane, NCheckbox } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { getResourceList } from '@/api/resources'
import type { ResourceListItem } from '@/api/resources'
import { useRole } from '@/composables/useRole'

const { getDetail, saveResources } = useRole()

const props = withDefaults(defineProps<{
  visible: boolean
  roleId?: number | null
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
const allResources = ref<ResourceListItem[]>([])
const checkedKeys = ref<(string | number)[]>([])
const selectedKeys = ref<(string | number)[]>([])
const activeType = ref('')

const typeTabs = [
  { label: '全部资源', value: '', color: '#60a5fa' },
  { label: '菜单', value: 'Menu', color: '#34d399' },
  { label: '按钮', value: 'Button', color: '#fbbf24' },
  { label: '接口', value: 'Api', color: '#f87171' },
  { label: '页面元素', value: 'Element', color: '#a78bfa' },
]

// 需要以分组 flat 列表展示的类型（非树形）
const flatTypes = new Set(['Button', 'Api', 'Element'])

const typeCounts = computed(() => {
  const counts: Record<string, number> = { '': allResources.value.length }
  for (const item of allResources.value) {
    const t = item.type || 'Unknown'
    counts[t] = (counts[t] || 0) + 1
  }
  return counts
})

// ---- 树形数据（用于 全部 / Menu） ----

function buildTree(items: ResourceListItem[], typeFilter: string): TreeOption[] {
  const map = new Map<number, TreeOption>()
  const roots: TreeOption[] = []
  const matchingType = new Set<number>()

  if (typeFilter) {
    for (const item of items) {
      if (item.type === typeFilter) {
        matchingType.add(item.id)
        let pid = item.parentId
        while (pid) {
          matchingType.add(pid)
          const parent = items.find((i) => i.id === pid)
          if (!parent) break
          pid = parent.parentId
        }
      }
    }
  }

  // 先统计每个节点的子节点数量
  const childCount = new Map<number, number>()
  for (const item of items) {
    if (item.parentId != null) {
      childCount.set(item.parentId, (childCount.get(item.parentId) || 0) + 1)
    }
  }

  for (const item of items) {
    if (typeFilter && !matchingType.has(item.id)) continue
    const isTargetType = !typeFilter || item.type === typeFilter
    const hasChildren = (childCount.get(item.id) || 0) > 0
    map.set(item.id, {
      key: item.id,
      label: item.name || item.code || `#${item.id}`,
      disabled: !isTargetType,
      // 如果没有子节点，不设置 isLeaf，让 tree 自动判断
    })
  }

  for (const item of items) {
    if (typeFilter && !matchingType.has(item.id)) continue
    const node = map.get(item.id)
    if (!node) continue
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

const treeData = computed(() => buildTree(allResources.value, activeType.value))

// ---- 分组 flat 数据（用于 Button / Api / Element） ----

/** 按父节点分组 */
const groupedItems = computed(() => {
  const items = allResources.value.filter((i) => i.type === activeType.value)
  const parentMap = new Map<number, ResourceListItem>()
  for (const item of allResources.value) {
    if (item.type === 'Menu') parentMap.set(item.id, item)
  }

  const groups: { parentName: string; parentId: number | null; children: ResourceListItem[] }[] = []
  const groupMap = new Map<number | null, ResourceListItem[]>()

  for (const item of items) {
    const pid = item.parentId ?? null
    if (!groupMap.has(pid)) groupMap.set(pid, [])
    groupMap.get(pid)!.push(item)
  }

  for (const [pid, children] of groupMap) {
    const parentName = pid !== null && parentMap.has(pid)
      ? parentMap.get(pid)!.name || parentMap.get(pid)!.code || `#${pid}`
      : '未分类'
    groups.push({ parentName, parentId: pid, children })
  }

  // 按 parentName 排序
  groups.sort((a, b) => a.parentName.localeCompare(b.parentName, 'zh'))
  return groups
})

function isChecked(id: number): boolean {
  return checkedKeys.value.includes(id)
}

function toggleItem(id: number) {
  const idx = checkedKeys.value.indexOf(id)
  if (idx === -1) {
    checkedKeys.value.push(id)
  } else {
    checkedKeys.value.splice(idx, 1)
  }
}

function toggleGroup(group: typeof groupedItems.value[number]) {
  const allChecked = group.children.every((c) => checkedKeys.value.includes(c.id))
  const groupIds = group.children.map((c) => c.id)
  if (allChecked) {
    checkedKeys.value = checkedKeys.value.filter((k) => !groupIds.includes(k as number))
  } else {
    const existing = new Set(checkedKeys.value)
    for (const id of groupIds) existing.add(id)
    checkedKeys.value = Array.from(existing)
  }
}

function isGroupAllChecked(group: typeof groupedItems.value[number]): boolean {
  return group.children.length > 0 && group.children.every((c) => checkedKeys.value.includes(c.id))
}

// ---- 生命周期 ----

async function loadResources() {
  treeLoading.value = true
  try {
    const res = await getResourceList()
    allResources.value = res.items || []
  } catch {
    allResources.value = []
  } finally {
    treeLoading.value = false
  }
}

async function loadRoleResources(roleId: number) {
  const detail = await getDetail(roleId)
  if (detail?.resourceIds) {
    checkedKeys.value = detail.resourceIds
  }
}

async function handleSubmit() {
  if (!props.roleId) return
  submitting.value = true
  try {
    const ok = await saveResources(props.roleId, checkedKeys.value as number[])
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
    activeType.value = ''
    checkedKeys.value = []
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

    <n-tabs v-model:value="activeType" type="line" animated class="resource-modal__tabs">
      <n-tab-pane
        v-for="tab in typeTabs"
        :key="tab.value"
        :name="tab.value"
        :tab="`${tab.label} (${typeCounts[tab.value] || 0})`"
      >
        <!-- 树形展示：全部资源 / 菜单 -->
        <div v-if="!flatTypes.has(activeType)" class="resource-modal__tree">
          <n-spin :show="treeLoading">
            <n-empty v-if="!treeLoading && treeData.length === 0" description="暂无资源" />
            <n-tree
              v-else
              :data="treeData"
              :checked-keys="checkedKeys"
              :selected-keys="selectedKeys"
              checkable
              selectable
              cascade
              check-strategy="child"
              @update:checked-keys="checkedKeys = $event"
              @update:selected-keys="selectedKeys = $event"
            />
          </n-spin>
        </div>

        <!-- 分组 flat 列表：按钮 / 接口 / 页面元素 -->
        <div v-else class="resource-modal__tree">
          <n-spin :show="treeLoading">
            <template v-if="!treeLoading && groupedItems.length === 0">
              <n-empty description="暂无资源" />
            </template>
            <template v-else>
              <div
                v-for="group in groupedItems"
                :key="group.parentId ?? '__root'"
                class="resource-group"
              >
                <div class="resource-group__header" @click="toggleGroup(group)">
                  <span class="resource-group__checkbox">
                    <n-checkbox :checked="isGroupAllChecked(group)" />
                  </span>
                  <span class="resource-group__title">{{ group.parentName }}</span>
                  <span class="resource-group__count">{{ group.children.length }}</span>
                </div>
                <div class="resource-group__items">
                  <div
                    v-for="item in group.children"
                    :key="item.id"
                    class="resource-item"
                    :class="{ 'resource-item--checked': isChecked(item.id) }"
                    @click="toggleItem(item.id)"
                  >
                    <n-checkbox :checked="isChecked(item.id)" />
                    <span class="resource-item__name">{{ item.name || item.code || `#${item.id}` }}</span>
                    <span v-if="item.path" class="resource-item__path">{{ item.httpMethod ? `${item.httpMethod} ` : '' }}{{ item.path }}</span>
                    <span v-if="item.code && item.code !== item.name" class="resource-item__code">{{ item.code }}</span>
                  </div>
                </div>
              </div>
            </template>
          </n-spin>
        </div>
      </n-tab-pane>
    </n-tabs>

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
.resource-modal__tabs {
  margin-bottom: 0;
}
.resource-modal__tree {
  max-height: 400px;
  overflow-y: auto;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px;
  margin-top: 4px;
}
.resource-modal__tree :deep(.n-tree-node--disabled) {
  opacity: 0.4;
}

/* 分组列表样式 */
.resource-group + .resource-group {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}
.resource-group__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
  user-select: none;
}
.resource-group__header:hover {
  background: var(--bg-glass-hover);
}
.resource-group__checkbox {
  display: flex;
  align-items: center;
}
.resource-group__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.resource-group__count {
  font-size: 11px;
  color: var(--text-quaternary);
  background: var(--bg-glass);
  padding: 0 8px;
  border-radius: 10px;
  line-height: 20px;
}
.resource-group__items {
  padding-left: 4px;
  margin-top: 2px;
}
.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.resource-item:hover {
  background: var(--bg-glass-hover);
}
.resource-item--checked {
  background: rgba(230, 57, 124, 0.05);
}
.resource-item__name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}
.resource-item__path {
  font-size: 11px;
  color: var(--text-quaternary);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.resource-item__code {
  font-size: 11px;
  color: var(--text-quaternary);
  background: var(--bg-glass);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.resource-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
