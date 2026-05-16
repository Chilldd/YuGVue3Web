<script setup lang="ts">
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'

const appStore = useAppStore()
</script>

<template>
  <n-layout style="height: 100vh" position="absolute">
    <n-layout has-sider style="height: 100%">
      <n-layout-sider
        bordered
        inverted
        :collapsed="appStore.sidebarCollapsed"
        :width="240"
        :collapsed-width="64"
        collapse-mode="width"
        @update:collapsed="appStore.sidebarCollapsed = $event"
      >
        <AppSidebar />
      </n-layout-sider>

      <n-layout>
        <n-layout-header style="height: 64px; background: var(--brand-dark);">
          <AppHeader />
        </n-layout-header>
        <n-layout-content
          :native-scrollbar="true"
          style="padding: 24px; background: #1A1A1D; height: calc(100vh - 64px);"
        >
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-layout>
</template>
