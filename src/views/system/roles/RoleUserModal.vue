<script setup lang="ts">
import { ref, computed, h, watch } from 'vue'
import { NModal, NDataTable, NButton, NSelect, NSpin, NSpace } from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'
import type { UserListItem } from '@/api/user'
import { getUserList } from '@/api/user'
import { useRole } from '@/composables/useRole'

const { roleUsers, roleUsersLoading, fetchRoleUsers, confirmAssignRoleUsers, confirmRemoveRoleUsers } = useRole()

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

const allUsers = ref<UserListItem[]>([])
const selectedNewUserIds = ref<string[]>([])
const checkedUserIds = ref<string[]>([])
const assigning = ref(false)

const columns: DataTableColumn<UserListItem>[] = [
  { type: 'selection' },
  {
    title: '用户名', key: 'username', ellipsis: true, minWidth: 120,
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
]

const userSelectOptions = computed(() => {
  const existingIds = new Set(roleUsers.value.map((u) => u.id))
  return allUsers.value
    .filter((u) => !existingIds.has(u.id))
    .map((u) => ({
      label: u.username || `#${u.id}`,
      value: u.id,
    }))
})

async function loadAllUsers() {
  try {
    const res = await getUserList()
    allUsers.value = res.items || []
  } catch {
    allUsers.value = []
  }
}

async function handleAssign() {
  if (!props.roleId || selectedNewUserIds.value.length === 0) return
  assigning.value = true
  try {
    const ok = await confirmAssignRoleUsers(props.roleId, selectedNewUserIds.value, () => {
      selectedNewUserIds.value = []
      fetchRoleUsers(props.roleId!)
    })
    if (ok) {
      emit('saved')
    }
  } finally {
    assigning.value = false
  }
}

function handleBatchRemove() {
  if (!props.roleId || checkedUserIds.value.length === 0) return
  confirmRemoveRoleUsers(
    props.roleId,
    props.roleName || '',
    checkedUserIds.value,
    () => {
      checkedUserIds.value = []
      fetchRoleUsers(props.roleId!)
    },
  )
}

function handleCheckedChange(keys: Array<string | number>) {
  checkedUserIds.value = keys.map(String)
}

function handleClose() {
  emit('update:visible', false)
}

watch(() => props.visible, (v) => {
  if (v && props.roleId) {
    selectedNewUserIds.value = []
    checkedUserIds.value = []
    fetchRoleUsers(props.roleId)
    loadAllUsers()
  }
})
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    title="角色用户"
    :bordered="false"
    :segmented="{ content: true, footer: true }"
    style="width:640px"
    @update:show="handleClose"
  >
    <div class="role-user__toolbar">
      <p class="role-user__hint">
        角色「{{ roleName }}」当前关联 {{ roleUsers.length }} 个用户
      </p>
      <n-button
        type="error"
        size="small"
        :disabled="checkedUserIds.length === 0"
        @click="handleBatchRemove"
      >
        批量取消（{{ checkedUserIds.length }}）
      </n-button>
    </div>

    <n-spin :show="roleUsersLoading">
      <n-data-table
        :columns="columns"
        :data="roleUsers"
        :row-key="(row: UserListItem) => row.id"
        :checked-row-keys="checkedUserIds"
        :max-height="280"
        :bordered="false"
        size="small"
        @update:checked-row-keys="handleCheckedChange"
      />
    </n-spin>

    <div v-if="userSelectOptions.length > 0" class="role-user__assign">
      <div class="role-user__assign-label">分配用户（追加模式）</div>
      <n-space>
        <n-select
          v-model:value="selectedNewUserIds"
          :options="userSelectOptions"
          multiple
          placeholder="选择要分配的用户"
          style="width:380px"
          :max-tag-count="2"
        />
        <n-button
          type="primary"
          size="small"
          :loading="assigning"
          :disabled="selectedNewUserIds.length === 0"
          @click="handleAssign"
        >
          分配
        </n-button>
      </n-space>
    </div>

    <div v-else class="role-user__empty">
      已关联所有可用用户
    </div>

    <template #footer>
      <div class="role-user__footer">
        <n-button @click="handleClose">关闭</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.role-user__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.role-user__hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}
.role-user__assign {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
.role-user__assign-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.role-user__empty {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}
.role-user__footer {
  display: flex;
  justify-content: flex-end;
}
.cell-name {
  font-weight: 600;
  color: var(--text-primary);
}
.time-cell {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
