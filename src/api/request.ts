import axios from 'axios'
import { createDiscreteApi } from 'naive-ui'
import router from '@/router'

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

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      getMessage().error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    const { status, data } = error.response

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

      case 401:
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
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
