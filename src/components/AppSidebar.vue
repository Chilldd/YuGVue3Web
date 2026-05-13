<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import { NIcon, NMenu } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import type { MenuTreeItem } from '@/api/permission'
import {
  GridOutline,
  ShieldOutline,
  PeopleOutline,
  SettingsOutline,
  PersonOutline,
  KeyOutline,
  AppsOutline,
  LayersOutline,
  ListOutline,
  FolderOutline,
  DocumentOutline,
  CodeSlashOutline,
  ServerOutline,
  CloudOutline,
  GlobeOutline,
  HomeOutline,
  AnalyticsOutline,
  BarChartOutline,
  PieChartOutline,
  MenuOutline,
  LogOutOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const ICON_MAP: Record<string, Component> = {
  GridOutline,
  ShieldOutline,
  PeopleOutline,
  SettingsOutline,
  PersonOutline,
  KeyOutline,
  AppsOutline,
  LayersOutline,
  ListOutline,
  FolderOutline,
  DocumentOutline,
  CodeSlashOutline,
  ServerOutline,
  CloudOutline,
  GlobeOutline,
  HomeOutline,
  AnalyticsOutline,
  BarChartOutline,
  PieChartOutline,
  MenuOutline,
  LogOutOutline,
}

function resolveIcon(name: string | null): Component | undefined {
  return name ? ICON_MAP[name] : undefined
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

/** 递归转换为 Naive UI MenuOption */
function toMenuOptions(items: MenuTreeItem[]): MenuOption[] {
  return items
    .filter((item) => !item.isHidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => {
      const opt: MenuOption = {
        label: item.name || item.code || `#${item.id}`,
        key: item.route || String(item.id),
      }
      const icon = resolveIcon(item.icon)
      if (icon) {
        opt.icon = renderIcon(icon)
      }
      if (item.children?.length) {
        const children = toMenuOptions(item.children)
        if (children.length > 0) {
          opt.children = children
        }
      }
      return opt
    })
}

const menuOptions = computed(() => toMenuOptions(authStore.menuItems))

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
