<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ChatbubbleEllipsesOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import type { SessionListItem } from '@/api/ai'

defineOptions({ name: 'SessionPanel' })

const props = defineProps<{
  sessions: SessionListItem[]
  loading: boolean
  activeSessionId: string
  collapsed: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  rename: [id: string, title: string]
}>()

const editingSessionId = ref<string | null>(null)
const renameText = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function startRename(item: SessionListItem) {
  editingSessionId.value = item.sessionId
  renameText.value = item.title
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

function confirmRename(sid: string) {
  const title = renameText.value.trim()
  if (!title || editingSessionId.value !== sid) {
    editingSessionId.value = null
    return
  }
  emit('rename', sid, title)
  editingSessionId.value = null
}

function cancelRename() {
  editingSessionId.value = null
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay} 天前`
  return d.toLocaleDateString('zh-CN')
}
</script>

<template>
  <aside class="session-panel" :class="{ collapsed }">
    <div class="session-header">
      <span class="session-heading">历史会话</span>
    </div>
    <div class="session-scroll">
      <div v-if="loading" class="session-loading">
        <span class="dot" />
        <span class="dot" />
        <span class="dot" />
      </div>
      <div v-else-if="sessions.length === 0" class="session-empty">
        暂无会话记录
      </div>
      <div v-else class="session-list">
        <div
          v-for="s in sessions"
          :key="s.sessionId"
          class="session-item"
          :class="{ active: s.sessionId === activeSessionId }"
          @click="emit('select', s.sessionId)"
        >
          <ChatbubbleEllipsesOutline class="session-item-icon" />
          <div class="session-item-body">
            <template v-if="editingSessionId === s.sessionId">
              <input
                ref="renameInputRef"
                v-model="renameText"
                class="session-rename-input"
                @click.stop
                @keyup.enter="confirmRename(s.sessionId)"
                @keyup.escape="cancelRename"
                @blur="confirmRename(s.sessionId)"
              >
            </template>
            <span v-else class="session-item-title" @dblclick.stop="startRename(s)">{{ s.title }}</span>
            <span class="session-item-time">{{ formatRelativeTime(s.lastActiveAt) }}</span>
          </div>
          <button class="session-item-act" @click.stop="startRename(s)">
            <CreateOutline />
          </button>
          <button class="session-item-act session-item-del" @click.stop="emit('delete', s.sessionId)">
            <TrashOutline />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.session-panel {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: all 0.35s ease;
  overflow: hidden;
}

.session-panel.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
  opacity: 0;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px;
  flex-shrink: 0;
}

.session-heading {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
}

.session-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;
}

.session-scroll::-webkit-scrollbar {
  width: 3px;
}
.session-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.session-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
}

.session-loading {
  display: flex;
  gap: 5px;
  padding: 20px;
  justify-content: center;
}

.session-loading .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(230, 57, 124, 0.4);
  animation: dotBounce 1.4s ease-in-out infinite;
}
.session-loading .dot:nth-child(2) { animation-delay: 0.2s; }
.session-loading .dot:nth-child(3) { animation-delay: 0.4s; }

.session-empty {
  padding: 32px 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
  font-size: 13px;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.session-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.session-item.active {
  background: rgba(230, 57, 124, 0.08);
}

.session-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 2px;
  background: #E6397C;
  box-shadow: 0 0 8px rgba(230, 57, 124, 0.4);
}

.session-item-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.session-item.active .session-item-icon {
  color: #E6397C;
}

.session-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-item-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.session-item:hover .session-item-title {
  color: rgba(255, 255, 255, 0.85);
}

.session-item.active .session-item-title {
  color: #fff;
}

.session-item-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  white-space: nowrap;
}

.session-item-act {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  flex-shrink: 0;
  font-size: 11px;
}

.session-item:hover .session-item-act {
  opacity: 1;
}

.session-item-act:hover {
  background: rgba(230, 57, 124, 0.12);
  color: #E6397C;
}

.session-item-act svg {
  width: 13px;
  height: 13px;
}

.session-rename-input {
  width: 100%;
  border: none;
  outline: none;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(230, 57, 124, 0.3);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 13px;
  color: #fff;
  font-family: inherit;
  line-height: 1.4;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
