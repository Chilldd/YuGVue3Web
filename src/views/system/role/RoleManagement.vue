<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { darkTheme, NConfigProvider, NButton, NTag } from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'
import type { RoleListItem } from '@/api/role'
import { useRole } from '@/composables/useRole'
import CrudTable from '@/components/CrudTable.vue'
import RoleFormModal from './RoleFormModal.vue'
import RoleResourceModal from './RoleResourceModal.vue'

const {
  loading,
  listData,
  totalCount,
  fetchListWithRetry,
  toggleStatus,
  confirmDelete,
} = useRole()

const page = ref(1)
const pageSize = ref(10)
const checkedRowIds = ref<(string | number)[]>([])

const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const showResourceModal = ref(false)
const resourceRoleId = ref<number | null>(null)
const resourceRoleName = ref('')

function loadList() {
  fetchListWithRetry()
}

function onSaved() {
  loadList()
}

function openCreateModal() {
  isEdit.value = false
  editingId.value = null
  showFormModal.value = true
}

function openEditModal(row: RoleListItem) {
  isEdit.value = true
  editingId.value = row.id
  showFormModal.value = true
}

function openResourceModal(row: RoleListItem) {
  resourceRoleId.value = row.id
  resourceRoleName.value = row.name || row.code || `#${row.id}`
  showResourceModal.value = true
}

function handleDelete(row: RoleListItem) {
  confirmDelete(row, loadList)
}

async function handleToggleStatus(row: RoleListItem) {
  const ok = await toggleStatus(row)
  if (ok) loadList()
}

const columns: DataTableColumn<RoleListItem>[] = [
  { type: 'selection' },
  {
    title: '名称', key: 'name', ellipsis: true, minWidth: 140,
    render(row) { return h('span', { class: 'cell-name' }, row.name || '—') },
  },
  {
    title: '编码', key: 'code', ellipsis: true, minWidth: 120,
    render(row) { return h('span', { class: 'code-cell' }, row.code || '—') },
  },
  {
    title: '描述', key: 'description', ellipsis: true, minWidth: 180,
    render(row) { return h('span', { class: 'desc-cell' }, row.description || '—') },
  },
  {
    title: '状态', key: 'status', width: 80,
    render(row) {
      const on = row.status === 'Active'
      return h('span', { class: ['status-badge', on ? 'status-active' : 'status-inactive'] },
        on ? '启用' : '禁用')
    },
  },
  {
    title: '创建时间', key: 'createdAt', width: 170,
    render(row) {
      if (!row.createdAt) return '—'
      return h('span', { class: 'time-cell' }, new Date(row.createdAt).toLocaleString('zh-CN'))
    },
  },
  {
    title: '操作', key: 'actions', width: 300, fixed: 'right',
    render(row) {
      const btn = (label: string, cls: string, onClick: () => void) =>
        h('a', { class: ['action-btn', cls], onClick }, label)
      const btns = [
        btn('编辑', 'action-btn--edit', () => openEditModal(row)),
        btn('分配资源', 'action-btn--resource', () => openResourceModal(row)),
      ]
      if (row.status === 'Active') {
        btns.push(btn('禁用', 'action-btn--warn', () => handleToggleStatus(row)))
      } else {
        btns.push(btn('启用', 'action-btn--success', () => handleToggleStatus(row)))
      }
      btns.push(btn('删除', 'action-btn--danger', () => handleDelete(row)))
      return h('div', { class: 'action-group' }, btns)
    },
  },
]

onMounted(loadList)
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <div class="role-page">
      <div class="role-page__header">
        <div>
          <h1 class="role-page__title">角色管理</h1>
          <p class="role-page__desc">管理系统中的角色及其权限分配</p>
        </div>
        <div class="role-page__actions">
          <n-button quaternary size="small" :loading="loading" @click="loadList">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" @click="openCreateModal">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </template>
            新建角色
          </n-button>
        </div>
      </div>

      <CrudTable
        v-model:page="page"
        v-model:page-size="pageSize"
        v-model:checked-row-keys="checkedRowIds"
        :columns="columns"
        :data="listData"
        :loading="loading"
        :total="totalCount"
        :row-key="(row: RoleListItem) => row.id"
      />

      <RoleFormModal
        v-model:visible="showFormModal"
        :is-edit="isEdit"
        :editing-id="editingId"
        @saved="onSaved"
      />

      <RoleResourceModal
        v-model:visible="showResourceModal"
        :role-id="resourceRoleId"
        :role-name="resourceRoleName"
        @saved="onSaved"
      />
    </div>
  </n-config-provider>
</template>

<style scoped>
.role-page {
  min-height: 100%;
  padding: 4px;
}
.role-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.role-page__title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.role-page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}
.role-page__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.cell-name {
  font-weight: 600;
  color: var(--text-primary);
}
.code-cell {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-glass);
  padding: 2px 8px;
  border-radius: 4px;
}
.desc-cell {
  font-size: 12px;
  color: var(--text-tertiary);
}
.time-cell {
  font-size: 12px;
  color: var(--text-tertiary);
}
.action-group {
  display: flex;
  gap: 4px;
  align-items: center;
}
.action-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--action-edit);
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  color: var(--text-primary);
  background: var(--bg-glass-hover);
}
.action-btn--resource { color: #60a5fa; }
.action-btn--resource:hover { background: rgba(96, 165, 250, 0.1); }
.action-btn--warn { color: var(--action-warn); }
.action-btn--warn:hover { background: rgba(251, 191, 36, 0.1); }
.action-btn--success { color: var(--status-active); }
.action-btn--success:hover { background: rgba(52, 211, 153, 0.1); }
.action-btn--danger { color: var(--action-danger); }
.action-btn--danger:hover { background: rgba(248, 113, 113, 0.1); }

@media (max-width: 768px) {
  .role-page__header { flex-direction: column; }
}
</style>
