import { useAuthStore } from '@/stores/auth'

/**
 * 页面 API 权限检查 composable
 *
 * 在页面组件中使用：
 *   const { hasPermission } = usePermission()
 *   hasPermission('Resource.Create')  // 检查当前页面是否有 Resource.Create 权限
 */
export function usePermission() {
  const authStore = useAuthStore()

  function hasPermission(code: string): boolean {
    return authStore.pagePermissions.includes(code)
  }

  return { hasPermission }
}
