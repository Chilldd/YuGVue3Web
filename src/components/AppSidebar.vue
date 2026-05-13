<script setup lang="ts">
import { h, type Component } from 'vue'
import { NIcon, NMenu } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import {
  GridOutline,
  PeopleOutline,
  SettingsOutline,
  ShieldOutline,
} from '@vicons/ionicons5'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = [
  {
    label: '仪表盘',
    key: '/dashboard',
    icon: renderIcon(GridOutline),
  },
  {
    label: '资源管理',
    key: '/system/resources',
    icon: renderIcon(ShieldOutline),
  },
  {
    label: '角色管理',
    key: '/system/roles',
    icon: renderIcon(PeopleOutline),
  },
  {
    label: '用户管理',
    key: '/user',
    icon: renderIcon(PeopleOutline),
    children: [
      { label: '用户列表', key: '/user/list' },
      { label: '角色管理', key: '/user/role' },
    ],
  },
  {
    label: '系统设置',
    key: '/settings',
    icon: renderIcon(SettingsOutline),
  },
]

function handleMenuUpdate(key: string) {
  router.push(key)
}
</script>

<template>
  <div class="sidebar-wrap">
    <!-- Logo -->
    <div class="logo-area" :class="{ collapsed: appStore.sidebarCollapsed }">
      <span class="logo-dot" />
      <span v-if="!appStore.sidebarCollapsed" class="logo-text">YuG Admin</span>
      <span v-else class="logo-text-short">Y</span>
    </div>

    <!-- Menu -->
    <n-menu
      inverted
      :collapsed="appStore.sidebarCollapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
      :value="route.path"
      class="sidebar-menu"
      @update:value="handleMenuUpdate"
    />
  </div>
</template>

<style scoped>
.sidebar-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--brand-dark);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  transition: padding 0.3s;
}

.logo-area.collapsed {
  justify-content: center;
  padding: 0;
}

.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--brand-pink);
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(230, 57, 124, 0.6);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
  white-space: nowrap;
}

.logo-text-short {
  font-size: 20px;
  font-weight: 800;
  color: var(--brand-pink);
}

.sidebar-menu {
  flex: 1;
}

:deep(.n-layout-toggle-bar) {
  background: var(--brand-dark) !important;
}
</style>
