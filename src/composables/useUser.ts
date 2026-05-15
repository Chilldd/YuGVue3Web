import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { UserListItem } from '@/api/user'
import {
  getUserList,
  getUser,
  createUser,
  deleteUser,
  activateUser,
  disableUser,
  setUserRoles,
} from '@/api/user'
import type { CreateUserCommand, GetUserResult, SetUserRolesCommand } from '@/api/user'

export function useUser() {
  const message = useMessage()
  const dialog = useDialog()

  const loading = ref(false)
  const listData = ref<UserListItem[]>([])
  const totalCount = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const res = await getUserList()
      listData.value = res.items || []
      totalCount.value = res.totalCount || 0
    } catch {
      // 错误由全局拦截器处理
    } finally {
      loading.value = false
    }
  }

  async function fetchListWithRetry(retries = 2) {
    for (let i = 0; i <= retries; i++) {
      loading.value = true
      try {
        const res = await getUserList()
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

  async function remove(id: number) {
    await deleteUser(id)
  }

  async function batchRemove(ids: (string | number)[]) {
    await Promise.all(ids.map((id) => deleteUser(id as number)))
  }

  async function toggleStatus(row: UserListItem) {
    try {
      if (row.status === 'Active') {
        await disableUser(row.id)
        message.success('已禁用')
      } else {
        await activateUser(row.id)
        message.success('已启用')
      }
      return true
    } catch {
      return false
    }
  }

  function confirmDelete(row: UserListItem, onSuccess: () => void) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除用户「${row.username}」吗？此操作不可撤销。`,
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

  function confirmBatchDelete(ids: (string | number)[], onSuccess: () => void) {
    if (ids.length === 0) return
    dialog.warning({
      title: '批量删除',
      content: `确定要删除选中的 ${ids.length} 个用户吗？`,
      positiveText: '删除',
      negativeText: '取消',
      positiveButtonProps: { type: 'error' },
      onPositiveClick: async () => {
        try {
          await batchRemove(ids)
          message.success(`已删除 ${ids.length} 个用户`)
          onSuccess()
        } catch {
          // 错误由全局拦截器处理
        }
      },
    })
  }

  async function getDetail(id: number): Promise<GetUserResult | null> {
    try {
      return await getUser(id)
    } catch {
      return null
    }
  }

  async function save(data: CreateUserCommand): Promise<boolean> {
    try {
      await createUser(data)
      message.success('创建成功')
      return true
    } catch {
      return false
    }
  }

  async function saveRoles(data: SetUserRolesCommand): Promise<boolean> {
    try {
      await setUserRoles(data)
      message.success('角色分配成功')
      return true
    } catch {
      return false
    }
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
    saveRoles,
  }
}
