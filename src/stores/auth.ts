import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, getUserInfo } from '@/api/auth'
import type { LoginParams, UserInfo } from '@/api/auth'

const TOKEN_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem(TOKEN_KEY) || '')
  const refreshToken = ref(localStorage.getItem(REFRESH_KEY) || '')
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  async function loginAction(params: LoginParams) {
    const res = await login(params)
    accessToken.value = res.accessToken
    refreshToken.value = res.refreshToken
    localStorage.setItem(TOKEN_KEY, res.accessToken)
    localStorage.setItem(REFRESH_KEY, res.refreshToken)
    // 登录成功后自动获取用户信息
    const info = await getUserInfo()
    user.value = info
  }

  function setUser(info: UserInfo) {
    user.value = info
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  return { accessToken, refreshToken, user, isLoggedIn, loginAction, setUser, logout }
})
