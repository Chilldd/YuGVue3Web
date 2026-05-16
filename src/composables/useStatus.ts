import { ref, onMounted, onUnmounted } from 'vue'
import { getStatus, getHealth, getReady } from '@/api/system/status'
import type { GetStatusResult, ServerInfo, HealthCheckResult } from '@/api/system/status'
import type { GetHealthResult, GetReadyResult } from '@/api/system/status'

export function useStatus() {
  const status = ref<GetStatusResult | null>(null)
  const serverInfo = ref<ServerInfo | null>(null)
  const health = ref<HealthCheckResult | null>(null)

  const liveness = ref<GetHealthResult | null>(null)
  const readiness = ref<GetReadyResult | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasAccess = ref(true)

  let statusTimer: ReturnType<typeof setInterval> | null = null
  let healthTimer: ReturnType<typeof setInterval> | null = null
  let readyTimer: ReturnType<typeof setInterval> | null = null

  async function fetchStatus() {
    loading.value = true
    error.value = null
    try {
      const res = await getStatus()
      status.value = res
      serverInfo.value = res.server
      health.value = res.health
      hasAccess.value = true
    } catch (err: any) {
      if (err?.response?.status === 403) {
        hasAccess.value = false
      } else {
        error.value = err?.message || '获取系统状态失败'
      }
      status.value = null
      serverInfo.value = null
      health.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchHealth() {
    try {
      const res = await getHealth()
      liveness.value = res
    } catch {
      // health 接口匿名可访问，失败时不污染主状态
    }
  }

  async function fetchReady() {
    try {
      const res = await getReady()
      readiness.value = res
    } catch {
      // ready 接口匿名可访问，失败时不污染主状态
    }
  }

  function parseUptime(uptimeStr: string): { days: number; hours: number; minutes: number } {
    const parts = uptimeStr.split(':')
    if (parts.length === 3) {
      const hasDays = parts[0].includes('.')
      if (hasDays) {
        const [d, h] = parts[0].split('.')
        return { days: parseInt(d) || 0, hours: parseInt(h) || 0, minutes: parseInt(parts[1]) || 0 }
      }
      return { days: 0, hours: parseInt(parts[0]) || 0, minutes: parseInt(parts[1]) || 0 }
    }
    return { days: 0, hours: 0, minutes: 0 }
  }

  function formatUptime(uptime: string): string {
    const { days, hours, minutes } = parseUptime(uptime)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  function toNumber(v: number | string): number {
    return typeof v === 'string' ? parseFloat(v) : v
  }

  function formatBytesMB(mb: number | string): string {
    const n = toNumber(mb)
    if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`
    return `${n.toFixed(0)} MB`
  }

  function formatBytesGB(gb: number | string): string {
    const n = toNumber(gb)
    if (n >= 1024) return `${(n / 1024).toFixed(2)} TB`
    return `${n.toFixed(1)} GB`
  }

  onMounted(() => {
    fetchStatus()
    fetchHealth()
    fetchReady()

    statusTimer = setInterval(fetchStatus, 30000)
    healthTimer = setInterval(fetchHealth, 10000)
    readyTimer = setInterval(fetchReady, 20000)
  })

  onUnmounted(() => {
    if (statusTimer) clearInterval(statusTimer)
    if (healthTimer) clearInterval(healthTimer)
    if (readyTimer) clearInterval(readyTimer)
  })

  return {
    status,
    serverInfo,
    health,
    liveness,
    readiness,
    loading,
    error,
    hasAccess,
    fetchStatus,
    formatUptime,
    formatBytesMB,
    formatBytesGB,
  }
}
