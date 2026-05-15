<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { NButton, NConfigProvider, darkTheme } from 'naive-ui'
import { syncApiResources } from '@/api/system/tool'
import { usePermission } from '@/composables/usePermission'
import { tool as toolPerm } from '@/constants/permissions'

const message = useMessage()
const { hasPermission } = usePermission()

interface ToolItem {
  label: string
  description: string
  icon: string
  permissionCode?: string
  action: () => Promise<void>
}

const toolItems: ToolItem[] = [
  {
    label: '同步 API 资源',
    description: '扫描后端所有的权限接口，更新系统中的 API 资源列表，更新后可以在资源管理中维护 API 所属页面和权限',
    icon: 'M4 4v16h16V4H4zm2 2h12v12H6V6zm3 3h6v6H9V9z',
    permissionCode: toolPerm.syncApiResources,
    action: async () => {
      try {
        const res = await syncApiResources()
        if (res.success) {
          message.success('API 资源同步成功')
        } else {
          message.warning(res.message || '同步完成，部分资源可能未更新')
        }
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '同步失败')
      }
    },
  },
]

const running = ref(false)
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <div class="tool-page">
      <!-- Header -->
      <div class="tool-page__header">
        <div>
          <h1 class="tool-page__title">后端工具</h1>
          <p class="tool-page__desc">系统工具与维护操作</p>
        </div>
      </div>

      <!-- Tool Cards -->
      <div class="tool-grid">
        <template v-for="(item, index) in toolItems" :key="index">
          <div
            v-if="!item.permissionCode || hasPermission(item.permissionCode)"
            class="tool-card"
          >
          <div class="tool-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path :d="item.icon" />
            </svg>
          </div>
          <div class="tool-card__body">
            <h3 class="tool-card__title">{{ item.label }}</h3>
            <p class="tool-card__desc">{{ item.description }}</p>
          </div>
          <n-button
            type="primary"
            size="small"
            :loading="running"
            @click="item.action"
          >
            执行
          </n-button>
        </div>
        </template>
      </div>
    </div>
  </n-config-provider>
</template>

<style scoped>
.tool-page {
  min-height: 100%;
  padding: 4px;
}

.tool-page__header {
  margin-bottom: 28px;
}
.tool-page__title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.tool-page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}

.tool-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}
.tool-card:hover {
  border-color: rgba(230, 57, 124, 0.2);
  box-shadow: 0 0 20px rgba(230, 57, 124, 0.06);
}

.tool-card__icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(230, 57, 124, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E6397C;
}

.tool-card__body {
  flex: 1;
  min-width: 0;
}
.tool-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}
.tool-card__desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
