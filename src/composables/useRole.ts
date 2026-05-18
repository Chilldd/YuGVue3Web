import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { RoleListItem } from '@/api/system/role'
import {
  getRoleList,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  activateRole,
  disableRole,
  assignResources,
  getRoleUsers,
  assignRoleUsers,
  removeRoleUsers,
} from '@/api/system/role'
import type {
  CreateRoleCommand,
  UpdateRoleCommand,
  GetRoleDetailResult,
} from '@/api/system/role'
import type { UserListItem } from '@/api/system/user'

export function useRole() {
  const message = useMessage()
  const dialog = useDialog()

  const loading = ref(false)
  const listData = ref<RoleListItem[]>([])
  const totalCount = ref(0)

  async function fetchList(page = 1, pageSize = 10) {
    loading.value = true
    try {
      const res = await getRoleList({ page, pageSize })
      listData.value = res.items || []
      totalCount.value = res.totalCount || 0
    } catch {
      // 错误由全局拦截器处理
    } finally {
      loading.value = false
    }
  }

  /** 带重试的获取，最多重试 2 次 */
  async function fetchListWithRetry(page = 1, pageSize = 10, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      loading.value = true
      try {
        const res = await getRoleList({ page, pageSize })
        listData.value = res.items || []
        totalCount.value = res.totalCount || 0
        return
      } catch {
        if (i < retries) continue
      } finally {
        loading.value = false
      }
    }
  }

  async function remove(id: string) {
    await deleteRole(id)
  }

  async function batchRemove(ids: string[]) {
    await Promise.all(ids.map((id) => deleteRole(id)))
  }

  async function toggleStatus(row: RoleListItem) {
    try {
      if (row.status === 'Active') {
        await disableRole(row.id)
        message.success('已禁用')
      } else {
        await activateRole(row.id)
        message.success('已启用')
      }
      return true
    } catch {
      return false
    }
  }

  function confirmDelete(
    row: RoleListItem,
    onSuccess: () => void,
  ) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除角色「${row.name || row.code}」吗？此操作不可撤销。`,
      positiveText: '删除',
      negativeText: '取消',
      positiveButtonProps: { type: 'error' },
      onPositiveClick: async () => {
        try {
          await remove(row.id)
          message.success('删除成功')
          onSuccess()
        } catch {
          // 错误由全局拦截器处理
        }
      },
    })
  }

  function confirmBatchDelete(
    ids: string[],
    onSuccess: () => void,
  ) {
    if (ids.length === 0) return
    dialog.warning({
      title: '批量删除',
      content: `确定要删除选中的 ${ids.length} 个角色吗？`,
      positiveText: '删除',
      negativeText: '取消',
      positiveButtonProps: { type: 'error' },
      onPositiveClick: async () => {
        try {
          await batchRemove(ids)
          message.success(`已删除 ${ids.length} 个角色`)
          onSuccess()
        } catch {
          // 错误由全局拦截器处理
        }
      },
    })
  }

  async function getDetail(id: string): Promise<GetRoleDetailResult | null> {
    try {
      return await getRole(id)
    } catch {
      return null
    }
  }

  async function save(data: CreateRoleCommand, id?: string | null): Promise<boolean> {
    try {
      if (id) {
        await updateRole(id, { ...data, id })
        message.success('更新成功')
      } else {
        await createRole(data)
        message.success('创建成功')
      }
      return true
    } catch {
      return false
    }
  }

  async function saveResources(roleId: string, resourceIds: string[]): Promise<boolean> {
    try {
      await assignResources(roleId, { roleId, resourceIds })
      message.success('资源分配成功')
      return true
    } catch {
      return false
    }
  }

  const roleUsers = ref<UserListItem[]>([])
  const roleUsersLoading = ref(false)

  async function fetchRoleUsers(roleId: string) {
    roleUsersLoading.value = true
    try {
      const res = await getRoleUsers(roleId)
      roleUsers.value = res.items || []
    } catch {
      roleUsers.value = []
    } finally {
      roleUsersLoading.value = false
    }
  }

  async function confirmAssignRoleUsers(roleId: string, userIds: string[], onSuccess: () => void) {
    try {
      await assignRoleUsers({ roleId, userIds })
      message.success('用户分配成功')
      onSuccess()
      return true
    } catch {
      return false
    }
  }

  function confirmRemoveRoleUsers(
    roleId: string,
    roleName: string,
    userIds: string[],
    onSuccess: () => void,
  ) {
    if (userIds.length === 0) return
    dialog.warning({
      title: '确认取消',
      content: `确定要取消 ${userIds.length} 个用户与角色「${roleName}」的关联吗？`,
      positiveText: '确认取消',
      negativeText: '取消',
      positiveButtonProps: { type: 'error' },
      onPositiveClick: async () => {
        try {
          await removeRoleUsers({ roleId, userIds })
          message.success(`已取消 ${userIds.length} 个用户的关联`)
          onSuccess()
        } catch {
          // 错误由全局拦截器处理
        }
      },
    })
  }

  return {
    loading,
    listData,
    totalCount,
    fetchList,
    fetchListWithRetry,
    remove,
    batchRemove,
    toggleStatus,
    confirmDelete,
    confirmBatchDelete,
    getDetail,
    save,
    saveResources,
    roleUsers,
    roleUsersLoading,
    fetchRoleUsers,
    confirmAssignRoleUsers,
    confirmRemoveRoleUsers,
  }
}
