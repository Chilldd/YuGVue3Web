import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logoutApi, getUserInfo } from '@/api/auth'
import type { LoginParams, UserInfo } from '@/api/auth'
import { getUserMenu, getPageApiPermissions } from '@/api/permission'
import type { MenuTreeItem } from '@/api/permission'

const TOKEN_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'
const EXPIRES_KEY = 'expiresAt'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem(TOKEN_KEY) || '')
  const refreshToken = ref(localStorage.getItem(REFRESH_KEY) || '')
  const expiresAt = ref(localStorage.getItem(EXPIRES_KEY) || '')
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  // ---- 权限相关 ----

  /** 当前用户的菜单树 */
  const menuItems = ref<MenuTreeItem[]>([])

  /** 当前页面的 API 权限编码列表 */
  const pagePermissions = ref<string[]>([])

  /** 是否已加载菜单 */
  const menuLoaded = ref(false)

  /** 检查当前页面是否拥有指定 API 权限编码 */
  function hasPagePermission(code: string): boolean {
    return pagePermissions.value.includes(code)
  }

  /** 规范化路由路径（去除末尾斜杠，统一小写） */
  function normalizeRoute(p: string): string {
    return p.replace(/\/+$/, '').toLowerCase()
  }

  /** 扁平化菜单树查找匹配 route 的节点 id */
  function findPageIdByRoute(path: string, items?: MenuTreeItem[]): string | null {
    const target = normalizeRoute(path)
    const list = items || menuItems.value
    for (const item of list) {
      if (item.route && normalizeRoute(item.route) === target) {
        return item.id
      }
      if (item.children?.length) {
        const found = findPageIdByRoute(path, item.children)
        if (found !== null) return found
      }
    }
    return null
  }

  /** 获取当前用户菜单树 */
  async function fetchUserMenu() {
    try {
      const res = await getUserMenu()
      menuItems.value = res.items || []
      menuLoaded.value = true
    } catch {
      menuItems.value = []
      menuLoaded.value = false
    }
  }

  /** 获取指定页面的 API 权限编码 */
  async function fetchPageApiPermissions(pageId: string) {
    try {
      const res = await getPageApiPermissions(pageId)
      pagePermissions.value = res.permissionCodes || []
    } catch {
      pagePermissions.value = []
    }
  }

  /** 根据路由路径加载页面 API 权限，优先使用路由 meta 中的 pageId */
  async function loadPagePermissionsByRoute(path: string, pageIdFromMeta?: string) {
    const pageId = pageIdFromMeta ?? findPageIdByRoute(path)
    if (pageId !== null && pageId !== undefined) {
      await fetchPageApiPermissions(pageId)
    } else {
      pagePermissions.value = []
    }
  }

  // ---- 登录/退出 ----

  async function loginAction(params: LoginParams) {
    const res = await login(params)
    accessToken.value = res.accessToken
    refreshToken.value = res.refreshToken
    expiresAt.value = res.expiresAt
    localStorage.setItem(TOKEN_KEY, res.accessToken)
    localStorage.setItem(REFRESH_KEY, res.refreshToken)
    localStorage.setItem(EXPIRES_KEY, res.expiresAt)
    const info = await getUserInfo()
    user.value = info
    // 登录后加载菜单
    await fetchUserMenu()
  }

  function setUser(info: UserInfo) {
    user.value = info
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await logoutApi(refreshToken.value)
      }
    } catch {
      // 即使服务端登出失败也清除本地状态
    }
    clearLocalState()
  }

  function clearLocalState() {
    accessToken.value = ''
    refreshToken.value = ''
    expiresAt.value = ''
    user.value = null
    menuItems.value = []
    pagePermissions.value = []
    menuLoaded.value = false
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(EXPIRES_KEY)
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user,
    isLoggedIn,
    menuItems,
    pagePermissions,
    menuLoaded,
    hasPagePermission,
    findPageIdByRoute,
    fetchUserMenu,
    fetchPageApiPermissions,
    loadPagePermissionsByRoute,
    loginAction,
    setUser,
    logout,
    clearLocalState,
  }
})
