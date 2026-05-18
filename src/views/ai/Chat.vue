<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NButton, useMessage, useDialog } from 'naive-ui'
import { SparklesOutline, RefreshOutline, ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import { sendChatMessageStream, getSessionList, deleteSession, renameSession, getSessionMessages } from '@/api/ai'
import type { SessionListItem, MessageItem } from '@/api/ai'
import type { ChatMessage, ToolCallInfo } from './types'
import SessionPanel from './SessionPanel.vue'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

const message = useMessage()
const dialog = useDialog()

// ---- Session State ----
const sessions = ref<SessionListItem[]>([])
const sessionsLoading = ref(false)
const sessionPanelOpen = ref(true)

// ---- Chat State ----
const sessionId = ref('')
const messages = ref<ChatMessage[]>([])
const loading = ref(false)
let abortController: AbortController | null = null

// ---- Lazy Load ----
const currentPage = ref(0)
const totalPages = ref(0)
const messagesLoading = ref(false)

// ---- MessageList ref for scroll ----
const messageListRef = ref<InstanceType<typeof MessageList> | null>(null)

function scrollToBottom() {
  messageListRef.value?.scrollToBottom()
}

// ---- Send ----
function handleSend(text: string) {
  if (!text || loading.value) return

  messages.value.push({
    role: 'user',
    content: text,
    timestamp: Date.now(),
    displayContent: text,
    isStreaming: false,
  })
  scrollToBottom()

  loading.value = true

  const aiIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    displayContent: '',
    isStreaming: true,
  })
  scrollToBottom()

  function getAiMsg(): ChatMessage {
    return messages.value[aiIndex]
  }

  abortController = new AbortController()

  const promise = sendChatMessageStream(
    { message: text, ...(sessionId.value ? { sessionId: sessionId.value } : {}) },
    {
      onDelta: (content) => {
        const msg = getAiMsg()
        msg.content += content
        msg.displayContent = msg.content
        scrollToBottom()
      },
      onToolCall: (toolCall) => {
        const msg = getAiMsg()
        if (!msg.toolCalls) {
          msg.toolCalls = []
        }
        msg.toolCalls.push({
          id: toolCall.id,
          name: toolCall.name,
          arguments: toolCall.arguments,
          isRunning: true,
        })
        scrollToBottom()
      },
      onToolResult: (toolResult) => {
        const msg = getAiMsg()
        if (msg.toolCalls) {
          const found = msg.toolCalls.find((tc) => tc.id === toolResult.id)
          if (found) {
            found.result = toolResult.content
            found.isRunning = false
          }
        }
        scrollToBottom()
      },
      onUsage: (usage) => {
        getAiMsg().usage = usage
      },
      onError: (err) => {
        const msg = getAiMsg()
        if (msg && !msg.content) {
          messages.value.pop()
        } else if (msg) {
          msg.isStreaming = false
        }
        message.error(err.message || '请求失败，请重试')
      },
      onComplete: (sid) => {
        const msg = getAiMsg()
        msg.isStreaming = false
        msg.timestamp = Date.now()
        if (sid) sessionId.value = sid
        scrollToBottom()
        fetchSessions()
      },
    },
    abortController.signal,
  )

  promise.finally(() => {
    loading.value = false
    abortController = null
  })
}

// ---- Stop ----
function handleStop() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  const last = messages.value[messages.value.length - 1]
  if (last && last.role === 'assistant') {
    if (!last.displayContent) {
      messages.value.pop()
    } else {
      last.isStreaming = false
    }
  }
  loading.value = false
}

// ---- New Session ----
function startNewSession() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  sessionId.value = ''
  messages.value = []
  loading.value = false
  currentPage.value = 0
  totalPages.value = 0
  fetchSessions()
}

// ---- Session Actions ----
async function fetchSessions() {
  sessionsLoading.value = true
  try {
    const res = await getSessionList()
    sessions.value = Array.isArray(res) ? res : (res as { items: SessionListItem[] }).items || []
  } catch {
    // silent
  } finally {
    sessionsLoading.value = false
  }
}

function mapMessageItem(item: MessageItem): ChatMessage {
  let toolCalls: ToolCallInfo[] | undefined
  if (item.toolCalls) {
    try {
      const parsed = JSON.parse(item.toolCalls)
      if (Array.isArray(parsed)) {
        toolCalls = parsed.map((tc: Record<string, string>) => ({
          id: tc.id ?? tc.Id ?? '',
          name: tc.name ?? tc.Name ?? '',
          arguments: tc.arguments ?? tc.Arguments ?? '',
          isRunning: false,
        }))
      }
    } catch {
      // ignore parse errors
    }
  }

  return {
    role: item.role as ChatMessage['role'],
    content: item.content,
    timestamp: new Date(item.createdAt).getTime(),
    displayContent: item.content,
    isStreaming: false,
    sequenceNumber: item.sequenceNumber,
    toolCalls,
  }
}

/** 将相邻的 tool 角色消息合并到前一条 assistant 消息的 toolCalls 中 */
function mergeToolMessages(list: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = []
  for (const msg of list) {
    if (msg.role === 'tool') {
      const prev = result[result.length - 1]
      if (prev && prev.role === 'assistant' && prev.toolCalls?.length && msg.content) {
        const lastTc = prev.toolCalls[prev.toolCalls.length - 1]
        lastTc.result = msg.content
        lastTc.isRunning = false
        continue
      }
    }
    result.push(msg)
  }
  return result
}

async function loadSessionMessages() {
  messagesLoading.value = true
  try {
    const res = await getSessionMessages(sessionId.value, 1)
    currentPage.value = res.page
    totalPages.value = res.totalPages
    const items = (res.items || [])
      .filter((item) => item.role !== 'system')
      .map(mapMessageItem)
    items.sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))
    messages.value = mergeToolMessages(items)
  } catch {
    // silent
  } finally {
    messagesLoading.value = false
  }
}

async function loadMoreMessages() {
  if (currentPage.value >= totalPages.value) return
  const nextPage = currentPage.value + 1
  messagesLoading.value = true
  try {
    const res = await getSessionMessages(sessionId.value, nextPage)
    currentPage.value = res.page
    const olderMessages = (res.items || [])
      .filter((item) => item.role !== 'system')
      .map(mapMessageItem)
    olderMessages.sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))
    messages.value = [...mergeToolMessages(olderMessages), ...messages.value]
  } catch {
    // silent
  } finally {
    messagesLoading.value = false
  }
}

async function switchSession(sid: string) {
  if (sid === sessionId.value) return
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  sessionId.value = sid
  messages.value = []
  loading.value = false
  currentPage.value = 0
  totalPages.value = 0
  await loadSessionMessages()
  scrollToBottom()
}

async function handleDeleteSession(sid: string) {
  const d = dialog.warning({
    title: '删除会话',
    content: '确定要删除此会话吗？删除后无法恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      d.loading = true
      try {
        await deleteSession(sid)
        if (sid === sessionId.value) {
          const remaining = sessions.value.filter((s) => s.sessionId !== sid)
          if (remaining.length > 0) {
            switchSession(remaining[0].sessionId)
          } else {
            sessionId.value = ''
            messages.value = []
          }
        }
        await fetchSessions()
      } catch {
        message.error('删除失败')
      }
    },
  })
}

async function handleRenameSession(sid: string, title: string) {
  try {
    await renameSession(sid, title)
    const found = sessions.value.find((s) => s.sessionId === sid)
    if (found) found.title = title
  } catch {
    message.error('重命名失败')
  }
}

// ---- Lifecycle ----
onMounted(() => {
  fetchSessions()
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>

<template>
  <div class="chat-root">
    <div class="chat-body">
      <SessionPanel
        :sessions="sessions"
        :loading="sessionsLoading"
        :active-session-id="sessionId"
        :collapsed="!sessionPanelOpen"
        @select="switchSession"
        @delete="handleDeleteSession"
        @rename="handleRenameSession"
      />

      <div class="chat-main">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <button class="sidebar-toggle" @click="sessionPanelOpen = !sessionPanelOpen">
              <ChevronForwardOutline v-if="!sessionPanelOpen" />
              <ChevronBackOutline v-else />
            </button>
            <div class="header-icon">
              <SparklesOutline />
            </div>
            <div class="header-info">
              <h2 class="header-title">AI 智能对话</h2>
              <span v-if="sessionId" class="header-subtitle">{{ sessionId.slice(0, 8) }}...</span>
            </div>
          </div>
          <NButton
            ghost
            class="new-session-btn"
            @click="startNewSession"
          >
            <template #icon>
              <RefreshOutline />
            </template>
            新对话
          </NButton>
        </div>

        <MessageList
          ref="messageListRef"
          :messages="messages"
          :messages-loading="messagesLoading"
          :has-more="currentPage < totalPages"
          @load-more="loadMoreMessages"
          @select-suggestion="handleSend"
        />

        <ChatInput
          :loading="loading"
          @send="handleSend"
          @stop="handleStop"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background: #1A1A1D;
  border-radius: 16px;
  overflow: hidden;
}

.chat-body {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ====== Header ====== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  background: rgba(26, 26, 29, 0.8);
  backdrop-filter: blur(20px);
  z-index: 2;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.sidebar-toggle {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(230, 57, 124, 0.15), rgba(255, 92, 157, 0.08));
  border: 1px solid rgba(230, 57, 124, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E6397C;
  font-size: 20px;
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.header-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.new-session-btn {
  --n-text-color: rgba(255, 255, 255, 0.55) !important;
  --n-border-color: rgba(255, 255, 255, 0.1) !important;
  --n-text-color-hover: #E6397C !important;
  --n-border-color-hover: rgba(230, 57, 124, 0.3) !important;
  font-size: 13px !important;
  border-radius: 10px !important;
  padding: 0 16px !important;
  height: 34px !important;
}

@media (max-width: 768px) {
  .chat-header {
    padding: 12px 16px;
  }
}
</style>
