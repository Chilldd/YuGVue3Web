import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUserInfo } from '@/api/auth'

const whiteList = ['/login']

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    if (whiteList.includes(to.path)) {
      return true
    }

    if (!authStore.isLoggedIn) {
      return `/login?redirect=${to.path}`
    }

    // 首次进入时加载用户信息和菜单
    if (!authStore.user) {
      try {
        const info = await getUserInfo()
        authStore.setUser(info)
        await authStore.fetchUserMenu()
      } catch {
        authStore.logout()
        return `/login?redirect=${to.path}`
      }
    }

    return true
  })

  // 路由切换后加载当前页面的 API 权限
  router.afterEach((to) => {
    const authStore = useAuthStore()
    if (to.path !== '/login') {
      authStore.loadPagePermissionsByRoute(to.path, to.meta?.pageId)
    }
  })
}
