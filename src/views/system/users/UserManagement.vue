<script setup lang="ts">
import { ref, h, watch, onMounted } from 'vue'
import { darkTheme, NConfigProvider, NButton, NTag } from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'
import type { UserListItem } from '@/api/system/user'
import { useUser } from '@/composables/useUser'
import { usePermission } from '@/composables/usePermission'
import { user } from '@/constants/permissions'
import CrudTable from '@/components/CrudTable.vue'
import UserFormModal from './UserFormModal.vue'
import UserRoleModal from './UserRoleModal.vue'

const {
  loading,
  listData,
  totalCount,
  fetchListWithRetry,
  toggleStatus,
  confirmDelete,
  confirmResetPassword,
} = useUser()

const { hasPermission } = usePermission()

const page = ref(1)
const pageSize = ref(10)

const showFormModal = ref(false)
const showRoleModal = ref(false)
const roleUserId = ref<string | null>(null)
const roleUsername = ref('')

function loadList() {
  fetchListWithRetry(page.value, pageSize.value)
}

watch(pageSize, () => {
  page.value = 1
})

watch([page, pageSize], () => {
  loadList()
})

function onSaved() {
  loadList()
}

function openCreateModal() {
  showFormModal.value = true
}

function openRoleModal(row: UserListItem) {
  roleUserId.value = row.id
  roleUsername.value = row.username || `#${row.id}`
  showRoleModal.value = true
}

function handleDelete(row: UserListItem) {
  confirmDelete(row, loadList)
}

async function handleToggleStatus(row: UserListItem) {
  const ok = await toggleStatus(row)
  if (ok) loadList()
}

function handleResetPassword(row: UserListItem) {
  confirmResetPassword(row, loadList)
}

const columns: DataTableColumn<UserListItem>[] = [
  {
    title: '用户名', key: 'username', ellipsis: true, minWidth: 140,
    render(row) { return h('span', { class: 'cell-name' }, row.username || '—') },
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
    title: '操作', key: 'actions', width: 280, fixed: 'right',
    render(row) {
      const btn = (label: string, cls: string, onClick: () => void) =>
        h('a', { class: ['action-btn', cls], onClick }, label)
      const btns = []
      if (hasPermission(user.setroles)) {
        btns.push(btn('分配角色', 'action-btn--role', () => openRoleModal(row)))
      }
      if ((row.status === 'Active' && hasPermission(user.disable)) || (row.status !== 'Active' && hasPermission(user.activate))) {
        btns.push(btn(row.status === 'Active' ? '禁用' : '启用', row.status === 'Active' ? 'action-btn--warn' : 'action-btn--success', () => handleToggleStatus(row)))
      }
      if (hasPermission(user.resetPassword)) {
        btns.push(btn('重置密码', 'action-btn--warn', () => handleResetPassword(row)))
      }
      if (hasPermission(user.delete)) {
        btns.push(btn('删除', 'action-btn--danger', () => handleDelete(row)))
      }
      return h('div', { class: 'action-group' }, btns)
    },
  },
]

onMounted(loadList)
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <div class="user-page">
      <div class="user-page__header">
        <div>
          <h1 class="user-page__title">用户管理</h1>
          <p class="user-page__desc">管理系统中的用户账号</p>
        </div>
        <div class="user-page__actions">
          <n-button quaternary size="small" :loading="loading" @click="loadList">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" @click="openCreateModal" v-if="hasPermission(user.create)">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </template>
            新建用户
          </n-button>
        </div>
      </div>

      <CrudTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :columns="columns"
        :data="listData"
        :loading="loading"
        :total="totalCount"
      />

      <UserFormModal
        v-model:visible="showFormModal"
        @saved="onSaved"
      />

      <UserRoleModal
        v-model:visible="showRoleModal"
        :user-id="roleUserId"
        :username="roleUsername"
        @saved="onSaved"
      />
    </div>
  </n-config-provider>
</template>

<style scoped>
.user-page {
  min-height: 100%;
  padding: 4px;
}
.user-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.user-page__title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.user-page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}
.user-page__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.cell-name {
  font-weight: 600;
  color: var(--text-primary);
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
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  color: var(--text-primary);
  background: var(--bg-glass-hover);
}
.action-btn--role { color: #60a5fa; }
.action-btn--role:hover { background: rgba(96, 165, 250, 0.1); }
.action-btn--warn { color: var(--action-warn); }
.action-btn--warn:hover { background: rgba(251, 191, 36, 0.1); }
.action-btn--success { color: var(--status-active); }
.action-btn--success:hover { background: rgba(52, 211, 153, 0.1); }
.action-btn--danger { color: var(--action-danger); }
.action-btn--danger:hover { background: rgba(248, 113, 113, 0.1); }

@media (max-width: 768px) {
  .user-page__header { flex-direction: column; }
}
</style>
