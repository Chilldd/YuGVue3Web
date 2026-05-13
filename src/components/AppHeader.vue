<script setup lang="ts">
import { h } from 'vue'
import { NButton, NDropdown, NAvatar, NIcon } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useRouter, useRoute } from 'vue-router'
import {
  MenuOutline,
  PersonOutline,
  LogOutOutline,
} from '@vicons/ionicons5'

const authStore = useAuthStore()
const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

const userDropdownOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(PersonOutline) }),
  },
  { type: 'divider' as const, key: 'd1' },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  },
]

function handleUserAction(key: string) {
  if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (key === 'profile') {
    // TODO: navigate to profile page
  }
}
</script>

<template>
  <div class="header-wrap">
    <div class="header-left">
      <n-button quaternary class="toggle-btn" @click="appStore.toggleSidebar">
        <template #icon>
          <n-icon :component="MenuOutline" />
        </template>
      </n-button>
      <div class="page-title">{{ (route.meta?.title as string) || '' }}</div>
    </div>

    <div class="header-right">
      <n-dropdown
        trigger="click"
        :options="userDropdownOptions"
        @select="handleUserAction"
      >
        <div class="user-info">
          <n-avatar round :size="32" class="user-avatar">
            {{ authStore.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </n-avatar>
          <span class="user-name">{{ authStore.user?.username || '用户' }}</span>
        </div>
      </n-dropdown>
    </div>
  </div>
</template>

<style scoped>
.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  background: var(--brand-dark);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-btn {
  color: #888 !important;
  font-size: 20px;
}
.toggle-btn:hover {
  color: var(--brand-pink) !important;
  background: rgba(230, 57, 124, 0.1) !important;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  position: relative;
  padding-left: 16px;
}
.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  background: var(--brand-pink);
  border-radius: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-info:hover {
  background: rgba(255, 255, 255, 0.06);
}

.user-avatar {
  background: var(--brand-pink) !important;
  color: #fff !important;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  color: #cccccc;
}
.user-info:hover .user-name {
  color: #ffffff;
}
</style>
