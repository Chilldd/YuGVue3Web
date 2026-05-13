import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { RoleListItem } from '@/api/role'
import {
  getRoleList,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  activateRole,
  disableRole,
  assignResources,
} from '@/api/role'
import type {
  CreateRoleCommand,
  UpdateRoleCommand,
  GetRoleDetailResult,
} from '@/api/role'

export function useRole() {
  const message = useMessage()
  const dialog = useDialog()

  const loading = ref(false)
  const listData = ref<RoleListItem[]>([])
  const totalCount = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const res = await getRoleList()
      listData.value = res.items || []
      totalCount.value = res.totalCount || 0
    } catch {
      message.error('获取角色列表失败')
    } finally {
      loading.value = false
    }
  }

  /** 带重试的获取，最多重试 2 次 */
  async function fetchListWithRetry(retries = 2) {
    for (let i = 0; i <= retries; i++) {
      loading.value = true
      try {
        const res = await getRoleList()
        listData.value = res.items || []
        totalCount.value = res.totalCount || 0
        return
      } catch {
        if (i < retries) continue
        message.error('获取角色列表失败')
      } finally {
        loading.value = false
      }
    }
  }

  async function remove(id: number) {
    await deleteRole(id)
  }

  async function batchRemove(ids: (string | number)[]) {
    await Promise.all(ids.map((id) => deleteRole(id as number)))
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
      message.error('操作失败')
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
          message.error('删除失败')
        }
      },
    })
  }

  function confirmBatchDelete(
    ids: (string | number)[],
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
          message.error('批量删除失败')
        }
      },
    })
  }

  async function getDetail(id: number): Promise<GetRoleDetailResult | null> {
    try {
      return await getRole(id)
    } catch {
      message.error('获取角色详情失败')
      return null
    }
  }

  async function save(data: CreateRoleCommand, id?: number | null): Promise<boolean> {
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
      message.error(id ? '更新失败' : '创建失败')
      return false
    }
  }

  async function saveResources(roleId: number, resourceIds: number[]): Promise<boolean> {
    try {
      await assignResources(roleId, { roleId, resourceIds })
      message.success('资源分配成功')
      return true
    } catch {
      message.error('资源分配失败')
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
    saveResources,
  }
}
