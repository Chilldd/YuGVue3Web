import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { ResourceListItem, ResourceTreeItem } from '@/api/system/resource'
import {
  getResourceList,
  getResourceTree,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  activateResource,
  disableResource,
} from '@/api/system/resource'
import type { CreateResourceCommand, UpdateResourceCommand, ResourceDetail } from '@/api/system/resource'

export interface ResourceFilters {
  type: string | null
  httpMethod: string | null
  status: string | null
}

export function useResource() {
  const message = useMessage()
  const dialog = useDialog()

  const loading = ref(false)
  const listData = ref<ResourceListItem[]>([])
  const totalCount = ref(0)

  const treeData = ref<ResourceTreeItem[]>([])
  const treeLoading = ref(false)
  const treeError = ref(false)

  async function fetchList(filters?: ResourceFilters, page = 1, pageSize = 10) {
    loading.value = true
    try {
      const params: Record<string, unknown> = { page, pageSize }
      if (filters?.type) params.type = filters.type
      if (filters?.httpMethod) params.httpMethod = filters.httpMethod
      if (filters?.status) params.status = filters.status
      const res = await getResourceList(params as any)
      listData.value = res.items || []
      totalCount.value = res.totalCount || 0
    } catch {
      // 错误由全局拦截器处理
    } finally {
      loading.value = false
    }
  }

  /** 带重试的获取，最多重试 2 次 */
  async function fetchListWithRetry(filters?: ResourceFilters, page = 1, pageSize = 10, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      loading.value = true
      try {
        const params: Record<string, unknown> = { page, pageSize }
        if (filters?.type) params.type = filters.type
        if (filters?.httpMethod) params.httpMethod = filters.httpMethod
        if (filters?.status) params.status = filters.status
        const res = await getResourceList(params as any)
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

  async function fetchTree(params?: { type?: string; status?: number }) {
    treeLoading.value = true
    treeError.value = false
    try {
      const res = await getResourceTree(params)
      treeData.value = res.items || []
    } catch {
      treeError.value = true
    } finally {
      treeLoading.value = false
    }
  }

  /** flatten tree to a flat list (for parent selectors etc.) */
  function flattenTree(items: ResourceTreeItem[]): ResourceTreeItem[] {
    const result: ResourceTreeItem[] = []
    for (const item of items) {
      result.push(item)
      if (item.children?.length) {
        result.push(...flattenTree(item.children))
      }
    }
    return result
  }

  async function remove(id: string) {
    await deleteResource(id)
  }

  async function batchRemove(ids: string[]) {
    await Promise.all(ids.map((id) => deleteResource(id)))
  }

  async function toggleStatus(row: ResourceListItem) {
    try {
      if (row.status === 'Active') {
        await disableResource(row.id)
        message.success('已禁用')
      } else {
        await activateResource(row.id)
        message.success('已启用')
      }
      return true
    } catch {
      return false
    }
  }

  function confirmDelete(
    row: ResourceListItem,
    onSuccess: () => void,
  ) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除资源「${row.name || row.code}」吗？此操作不可撤销。`,
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
      content: `确定要删除选中的 ${ids.length} 个资源吗？`,
      positiveText: '删除',
      negativeText: '取消',
      positiveButtonProps: { type: 'error' },
      onPositiveClick: async () => {
        try {
          await batchRemove(ids)
          message.success(`已删除 ${ids.length} 个资源`)
          onSuccess()
        } catch {
          // 错误由全局拦截器处理
        }
      },
    })
  }

  async function getDetail(id: string): Promise<ResourceDetail | null> {
    try {
      return await getResource(id)
    } catch {
      return null
    }
  }

  async function save(data: CreateResourceCommand, id?: string | null): Promise<boolean> {
    try {
      if (id) {
        await updateResource({ ...data, id })
        message.success('更新成功')
      } else {
        await createResource(data)
        message.success('创建成功')
      }
      return true
    } catch {
      return false
    }
  }

  return {
    loading,
    listData,
    totalCount,
    treeData,
    treeLoading,
    treeError,
    fetchList,
    fetchListWithRetry,
    fetchTree,
    flattenTree,
    remove,
    batchRemove,
    toggleStatus,
    confirmDelete,
    confirmBatchDelete,
    getDetail,
    save,
  }
}
