<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NCard, NGrid, NGi, NIcon, NSpin } from 'naive-ui'
import {
  TimeOutline,
  ServerOutline,
  PulseOutline,
  CloudOutline,
  CubeOutline,
  DesktopOutline,
  LayersOutline,
  CodeSlashOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
  HelpCircleOutline,
} from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useStatus } from '@/composables/useStatus'

const authStore = useAuthStore()
const {
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
} = useStatus()

const now = ref(new Date())
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  now.value = new Date()
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 60000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

const hour = computed(() => now.value.getHours())
const greeting = computed(() => {
  if (hour.value < 6) return '夜深了'
  if (hour.value < 12) return '早上好'
  if (hour.value < 14) return '中午好'
  if (hour.value < 18) return '下午好'
  return '晚上好'
})

const dateText = computed(() => {
  const d = now.value
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const wd = weekdays[d.getDay()]
  return `${y} 年 ${m} 月 ${day} 日 · 星期${wd}`
})

const healthStatus = computed(() => health.value?.status ?? null)
const healthText = computed(() => {
  switch (healthStatus.value) {
    case 'Healthy': return '健康'
    case 'Degraded': return '降级'
    case 'Unhealthy': return '异常'
    default: return '未知'
  }
})

const healthIcon = computed(() => {
  switch (healthStatus.value) {
    case 'Healthy': return CheckmarkCircleOutline
    case 'Degraded': return AlertCircleOutline
    case 'Unhealthy': return AlertCircleOutline
    default: return HelpCircleOutline
  }
})

const livenessStatusText = computed(() => {
  if (!liveness.value) return null
  return liveness.value.status === 'Healthy' ? '在线' : '异常'
})

const serviceList = computed(() => {
  // readiness 匿名可访问，优先使用；其次用 status 接口的 health 数据
  if (readiness.value?.services?.length) return readiness.value.services
  if (health.value?.services?.length) return health.value.services
  return []
})

const cpuCores = computed(() => serverInfo.value?.cpuCores ?? null)
const environment = computed(() => serverInfo.value?.environment ?? null)
const memoryPercent = computed(() => serverInfo.value?.memory.usagePercent ?? 0)
const diskPercent = computed(() => serverInfo.value?.disk.usagePercent ?? 0)

const uptimeDisplay = computed(() => {
  if (!serverInfo.value) return '--'
  return formatUptime(serverInfo.value.uptime)
})

const envLabel = computed(() => {
  const env = environment.value
  if (!env) return '--'
  if (env === 'Development') return '开发'
  if (env === 'Staging') return '预发布'
  if (env === 'Production') return '生产'
  return env
})

const envColor = computed(() => {
  const env = environment.value
  if (env === 'Production') return '#10b981'
  if (env === 'Staging') return '#f59e0b'
  return '#E6397C'
})

const isHealthy = computed(() => healthStatus.value === 'Healthy')
const isDegraded = computed(() => healthStatus.value === 'Degraded')
const isUnhealthy = computed(() => healthStatus.value === 'Unhealthy')

const healthColor = computed(() => {
  if (isHealthy.value) return '#10b981'
  if (isDegraded.value) return '#f59e0b'
  if (isUnhealthy.value) return '#ef4444'
  return '#888'
})

const greetingInitial = computed(() => {
  const name = authStore.user?.username
  return name ? name.charAt(0).toUpperCase() : '?'
})

function getServiceStatusColor(status: string) {
  switch (status) {
    case 'Healthy': return '#10b981'
    case 'Degraded': return '#f59e0b'
    case 'Unhealthy': return '#ef4444'
    default: return '#888'
  }
}

function getServiceStatusText(status: string) {
  switch (status) {
    case 'Healthy': return '正常'
    case 'Degraded': return '降级'
    case 'Unhealthy': return '异常'
    default: return '未知'
  }
}
</script>

<template>
  <div class="dashboard">
    <!-- Loading Overlay -->
    <div v-if="loading && !serverInfo" class="loading-overlay">
      <NSpin size="large" />
    </div>

    <!-- Permission Denied -->
    <div v-else-if="!hasAccess" class="status-blocked">
      <div class="blocked-icon">
        <n-icon :size="48"><HelpCircleOutline /></n-icon>
      </div>
      <h3>暂无访问权限</h3>
      <p>你没有查看系统状态的权限，请联系管理员</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !serverInfo" class="status-error">
      <div class="error-icon">
        <n-icon :size="48"><AlertCircleOutline /></n-icon>
      </div>
      <h3>获取系统状态失败</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchStatus">重试</button>
    </div>

    <!-- Dashboard Content -->
    <template v-else>
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-bg-pattern" />
        <div class="welcome-content">
          <div class="welcome-avatar">{{ greetingInitial }}</div>
          <div class="welcome-text">
            <h1 class="welcome-title">{{ greeting }}，{{ authStore.user?.username || '用户' }}</h1>
            <p class="welcome-desc">{{ dateText }}</p>
          </div>
          <div class="welcome-badge" :style="{ '--badge-color': envColor }">
            {{ envLabel }}
          </div>
          <div v-if="livenessStatusText" class="liveness-badge" :class="{ 'liveness-alive': liveness?.status === 'Healthy' }">
            <span class="liveness-dot" />
            <span>{{ livenessStatusText }}</span>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :screen-s="2" :screen-m="2">
        <n-gi>
          <n-card :bordered="false" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon-box" style="--icon-color: #E6397C">
                <n-icon :size="22"><TimeOutline /></n-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">运行时间</span>
                <span class="stat-value">{{ uptimeDisplay }}</span>
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card :bordered="false" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon-box" style="--icon-color: #8B5CF6">
                <n-icon :size="22"><CubeOutline /></n-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">CPU 核心</span>
                <span class="stat-value">{{ cpuCores !== null ? `${cpuCores} 核心` : '--' }}</span>
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card :bordered="false" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon-box" :style="{ '--icon-color': healthColor }">
                <n-icon :size="22">
                  <component :is="healthIcon" />
                </n-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">服务状态</span>
                <div class="stat-value health-value">
                  <span class="health-dot" :class="healthStatus" />
                  <span>{{ healthText }}</span>
                </div>
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card :bordered="false" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon-box" style="--icon-color: #0EA5E9">
                <n-icon :size="22"><CloudOutline /></n-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">运行环境</span>
                <span class="stat-value">{{ envLabel }}</span>
              </div>
            </div>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- Resources -->
      <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" :screen-s="1" :screen-m="1">
        <n-gi>
          <n-card :bordered="false" class="resource-card">
            <div class="resource-header">
              <div class="resource-title">
                <n-icon :size="18" color="#E6397C"><DesktopOutline /></n-icon>
                <span>内存使用</span>
              </div>
              <span class="resource-percent">{{ memoryPercent.toFixed(1) }}%</span>
            </div>
            <div class="resource-bar-track">
              <div
                class="resource-bar-fill memory-fill"
                :style="{ width: `${Math.min(memoryPercent, 100)}%` }"
              />
            </div>
            <div v-if="serverInfo" class="resource-details">
              <div class="resource-detail">
                <span class="detail-label">已用</span>
                <span class="detail-value used">{{ formatBytesMB(serverInfo.memory.usedMB) }}</span>
              </div>
              <div class="resource-detail">
                <span class="detail-label">可用</span>
                <span class="detail-value free">{{ formatBytesMB(serverInfo.memory.availableMB) }}</span>
              </div>
              <div class="resource-detail">
                <span class="detail-label">总计</span>
                <span class="detail-value total">{{ formatBytesMB(serverInfo.memory.totalMB) }}</span>
              </div>
            </div>
            <div v-else class="resource-details">
              <div class="resource-detail loading-text">加载中...</div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card :bordered="false" class="resource-card">
            <div class="resource-header">
              <div class="resource-title">
                <n-icon :size="18" color="#E6397C"><ServerOutline /></n-icon>
                <span>磁盘使用</span>
              </div>
              <span class="resource-percent">{{ diskPercent.toFixed(1) }}%</span>
            </div>
            <div class="resource-bar-track">
              <div
                class="resource-bar-fill disk-fill"
                :style="{ width: `${Math.min(diskPercent, 100)}%` }"
              />
            </div>
            <div v-if="serverInfo" class="resource-details">
              <div class="resource-detail">
                <span class="detail-label">已用</span>
                <span class="detail-value used">{{ formatBytesGB(serverInfo.disk.usedGB) }}</span>
              </div>
              <div class="resource-detail">
                <span class="detail-label">可用</span>
                <span class="detail-value free">{{ formatBytesGB(serverInfo.disk.availableGB) }}</span>
              </div>
              <div class="resource-detail">
                <span class="detail-label">总计</span>
                <span class="detail-value total">{{ formatBytesGB(serverInfo.disk.totalGB) }}</span>
              </div>
            </div>
            <div v-else class="resource-details">
              <div class="resource-detail loading-text">加载中...</div>
            </div>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- Info + Health -->
      <n-grid :cols="2" :x-gap="16" :y-gap="0" responsive="screen" :screen-s="1" :screen-m="1">
        <n-gi>
          <n-card :bordered="false" class="section-card" title="系统信息">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-label">
                  <n-icon :size="14" color="#E6397C"><ServerOutline /></n-icon>
                  <span>主机名</span>
                </div>
                <span class="info-value">{{ serverInfo?.hostname || '--' }}</span>
              </div>
              <div class="info-row">
                <div class="info-label">
                  <n-icon :size="14" color="#E6397C"><CodeSlashOutline /></n-icon>
                  <span>操作系统</span>
                </div>
                <span class="info-value">{{ serverInfo?.osDescription || '--' }}</span>
              </div>
              <div class="info-row">
                <div class="info-label">
                  <n-icon :size="14" color="#E6397C"><LayersOutline /></n-icon>
                  <span>运行时</span>
                </div>
                <span class="info-value">{{ serverInfo?.runtimeVersion || '--' }}</span>
              </div>
              <div class="info-row">
                <div class="info-label">
                  <n-icon :size="14" color="#E6397C"><PulseOutline /></n-icon>
                  <span>架构</span>
                </div>
                <span class="info-value">{{ serverInfo?.processArchitecture || '--' }}</span>
              </div>
              <div class="info-row">
                <div class="info-label">
                  <n-icon :size="14" color="#E6397C"><DesktopOutline /></n-icon>
                  <span>应用版本</span>
                </div>
                <span class="info-value">{{ serverInfo?.applicationVersion || '--' }}</span>
              </div>
              <div class="info-row">
                <div class="info-label">
                  <n-icon :size="14" color="#E6397C"><TimeOutline /></n-icon>
                  <span>启动时间</span>
                </div>
                <span class="info-value">{{ serverInfo?.startTime ? new Date(serverInfo.startTime).toLocaleString('zh-CN') : '--' }}</span>
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card :bordered="false" class="section-card" title="服务健康">
            <template v-if="serviceList.length">
              <div
                v-for="svc in serviceList"
                :key="svc.name"
                class="service-row"
              >
                <div class="service-left">
                  <span
                    class="service-dot"
                    :style="{ background: getServiceStatusColor(svc.status) }"
                  />
                  <span class="service-name">{{ svc.name }}</span>
                </div>
                <div class="service-right">
                  <span class="service-latency">{{ svc.latencyMs }}ms</span>
                  <span
                    class="service-status"
                    :style="{ color: getServiceStatusColor(svc.status) }"
                  >
                    {{ getServiceStatusText(svc.status) }}
                  </span>
                </div>
              </div>
            </template>
            <div v-else class="no-service">
              <n-icon :size="20" color="#888"><HelpCircleOutline /></n-icon>
              <span>暂无健康数据</span>
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  min-height: 400px;
}

/* ---- Loading ---- */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* ---- 403 ---- */
.status-blocked,
.status-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
}
.status-blocked h3,
.status-error h3 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}
.status-blocked p,
.status-error p {
  font-size: 14px;
  margin: 0;
}
.blocked-icon,
.error-icon {
  opacity: 0.5;
  color: #E6397C;
}

.retry-btn {
  margin-top: 8px;
  padding: 8px 24px;
  border-radius: 20px;
  border: 1px solid rgba(230, 57, 124, 0.3);
  background: rgba(230, 57, 124, 0.1);
  color: #E6397C;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}
.retry-btn:hover {
  background: rgba(230, 57, 124, 0.2);
  box-shadow: 0 0 20px rgba(230, 57, 124, 0.15);
}

/* ---- Welcome Banner ---- */
.welcome-banner {
  position: relative;
  border-radius: 16px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #1A1A1D 0%, #2d1a24 50%, #1A1A1D 100%);
  overflow: hidden;
  isolation: isolate;
}
.welcome-bg-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  background-image:
    radial-gradient(circle at 20% 50%, #E6397C 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(230, 57, 124, 0.5) 0%, transparent 40%);
  animation: bgDrift 8s ease-in-out infinite alternate;
}
@keyframes bgDrift {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.1) translate(-10px, -5px); }
}
.welcome-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}
.welcome-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #E6397C, #FF5C9D);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 0 24px rgba(230, 57, 124, 0.3);
}
.welcome-text {
  flex: 1;
}
.welcome-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
}
.welcome-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}
.welcome-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--badge-color, #E6397C);
  border: 1px solid color-mix(in srgb, var(--badge-color, #E6397C) 30%, transparent);
  background: color-mix(in srgb, var(--badge-color, #E6397C) 8%, transparent);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* ---- Liveness Badge ---- */
.liveness-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}
.liveness-badge.liveness-alive {
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
  background: rgba(16, 185, 129, 0.06);
}
.liveness-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: livenessPulse 2s ease-in-out infinite;
}
@keyframes livenessPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ---- Stats Cards ---- */
.stat-card {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.35s ease;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(230, 57, 124, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 0 24px rgba(230, 57, 124, 0.05);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--icon-color, #E6397C);
  background: color-mix(in srgb, var(--icon-color, #E6397C) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--icon-color, #E6397C) 15%, transparent);
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
  letter-spacing: 0.3px;
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.health-value {
  display: flex;
  align-items: center;
  gap: 8px;
}
.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.health-dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  animation: pulseRing 2s ease-in-out infinite;
}
.health-dot.Healthy { background: #10b981; }
.health-dot.Healthy::after { background: rgba(16, 185, 129, 0.3); }
.health-dot.Degraded { background: #f59e0b; }
.health-dot.Degraded::after { background: rgba(245, 158, 11, 0.3); }
.health-dot.Unhealthy { background: #ef4444; }
.health-dot.Unhealthy::after { background: rgba(239, 68, 68, 0.3); }

@keyframes pulseRing {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.8); opacity: 0; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ---- Resource Cards ---- */
.resource-card {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.35s ease;
}
.resource-card:hover {
  border-color: rgba(230, 57, 124, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.resource-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.resource-percent {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.resource-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 16px;
}
.resource-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease;
}
.memory-fill {
  background: linear-gradient(90deg, #E6397C, #FF5C9D);
  box-shadow: 0 0 12px rgba(230, 57, 124, 0.3);
}
.disk-fill {
  background: linear-gradient(90deg, #8B5CF6, #E6397C);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
}

.resource-details {
  display: flex;
  gap: 24px;
}
.resource-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
}
.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}
.detail-value.used { color: #E6397C; }
.detail-value.free { color: #10b981; }
.detail-value.total { color: rgba(255, 255, 255, 0.6); }
.loading-text {
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
}

/* ---- Section Cards ---- */
.section-card {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.35s ease;
}
.section-card:hover {
  border-color: rgba(230, 57, 124, 0.1);
}

/* Info Grid */
.info-grid {
  display: flex;
  flex-direction: column;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 500;
}
.info-value {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

/* Service Health */
.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.service-row:last-child {
  border-bottom: none;
}
.service-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.service-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
}
.service-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}
.service-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.service-latency {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
.service-status {
  font-size: 13px;
  font-weight: 600;
}

.no-service {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
  justify-content: center;
}

/* ---- Typography overrides ---- */
:deep(.n-card-header__main) {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
:deep(.n-card) {
  color: inherit;
}
:deep(.n-card__content) {
  padding-top: 0 !important;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .welcome-banner {
    padding: 20px;
  }
  .welcome-content {
    flex-wrap: wrap;
  }
  .welcome-badge {
    margin-left: 60px;
  }
  .resource-details {
    flex-wrap: wrap;
    gap: 16px;
  }
  .resource-percent {
    font-size: 22px;
  }
}
</style>
