import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { createDiscreteApi } from 'naive-ui'
import router from '@/router'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _isRetry?: boolean
  }
}

interface DiscreteMessage {
  error: (content: string) => void
  warning: (content: string) => void
}

let messageApi: DiscreteMessage | null = null

function getMessage(): DiscreteMessage {
  if (!messageApi) {
    messageApi = createDiscreteApi(['message']).message
  }
  return messageApi
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---- Auth header ----
// 登录和刷新端点不需要 Bearer token，其他请求自动带上
request.interceptors.request.use(
  (config) => {
    const noAuth = !!config.url && (/\/auth\/(login|refresh)$/i).test(config.url)
    if (!noAuth) {
      const token = localStorage.getItem('accessToken')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---- 401 refresh queue ----
interface QueueItem {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  config: InternalAxiosRequestConfig
}

let isRefreshing = false
let refreshQueue: QueueItem[] = []

request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (!error.response) {
      getMessage().error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    const { status, config, data } = error.response

    // ---- 401 令牌过期 / 未授权 ----
    if (status === 401 && !config._isRetry) {
      // 登录接口 401 → 凭证错误，交给调用方处理，不拦截
      if ((/\/auth\/login$/i).test(config.url || '')) {
        return Promise.reject(error)
      }

      // 刷新接口本身 401 → 刷新令牌已失效，直接跳转登录
      if ((/\/auth\/refresh$/i).test(config.url || '')) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // 正在刷新中 → 排队等待
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, config })
        })
      }

      isRefreshing = true
      const originalConfig = config

      try {
        const refreshTokenVal = localStorage.getItem('refreshToken')
        if (!refreshTokenVal) throw new Error('No refresh token')

        // 用独立请求调用刷新（不走 request 拦截器，防止死循环）
        const { baseURL } = request.defaults
        const refreshUrl = baseURL
          ? `${baseURL.replace(/\/+$/, '')}/api/Auth/refresh`
          : '/api/Auth/refresh'

        const refreshResp = await axios.post(refreshUrl, {
          refreshToken: refreshTokenVal,
        })

        const { accessToken: newToken, refreshToken: newRefreshToken } = refreshResp.data

        localStorage.setItem('accessToken', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // 重放排队中的请求
        refreshQueue.forEach((item) => {
          item.config.headers = item.config.headers || {}
          item.config.headers.Authorization = `Bearer ${newToken}`
          item.config._isRetry = true
          item.resolve(request(item.config))
        })
        refreshQueue = []

        // 重放原始请求
        originalConfig.headers = originalConfig.headers || {}
        originalConfig.headers.Authorization = `Bearer ${newToken}`
        originalConfig._isRetry = true
        return request(originalConfig)
      } catch (refreshError) {
        // 刷新失败 → 清空 token，所有排队的请求也一并拒绝
        refreshQueue.forEach((item) => item.reject(refreshError))
        refreshQueue = []
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // ---- 其他 HTTP 状态 ----
    switch (status) {
      case 400:
        if (data?.errors) {
          const details = Object.entries(data.errors as Record<string, string>)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n')
          getMessage().error(details || data.message || '请求参数错误')
        } else {
          getMessage().error(data?.message || '请求参数错误')
        }
        break

      case 403:
        getMessage().warning('权限不足')
        break

      case 404:
        router.push('/404')
        break

      case 500:
      default:
        getMessage().error(data?.message || '服务器错误')
        break
    }

    return Promise.reject(error)
  },
)

export default request
