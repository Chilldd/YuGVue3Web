<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { SparklesOutline, TerminalOutline } from '@vicons/ionicons5'
import { marked } from 'marked'
import type { ChatMessage } from './types'

defineOptions({ name: 'MessageList' })

const props = defineProps<{
  messages: ChatMessage[]
  messagesLoading: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  'load-more': []
  'select-suggestion': [text: string]
}>()

const messageListRef = ref<HTMLElement | null>(null)

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 新消息到达时自动滚动到底部
watch(
  () => props.messages.length,
  () => { scrollToBottom() },
)

// 流式增量内容时滚动
watch(
  () => {
    const last = props.messages[props.messages.length - 1]
    return last?.displayContent ?? ''
  },
  () => { scrollToBottom() },
)

defineExpose({ scrollToBottom })

// ---- Lazy Load ----
let isLoadingMore = false

function handleScroll() {
  if (isLoadingMore || !props.hasMore) return
  const el = messageListRef.value
  if (!el) return
  if (el.scrollTop < 80) {
    isLoadingMore = true
    emit('load-more')
  }
}

watch(() => props.messagesLoading, (v) => {
  if (!v) isLoadingMore = false
})

// ---- Time ----
function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// ---- Markdown ----
function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text, { async: false }) as string
}

/** 判断工具调用参数是否为空 */
function argsEmpty(args: string): boolean {
  if (!args) return true
  const t = args.trim()
  return t === '' || t === '{}' || t === '[]' || t === '""'
}
</script>

<template>
  <div ref="messageListRef" class="chat-messages" @scroll="handleScroll">
    <!-- Loading More (lazy load) -->
    <div v-if="messagesLoading && messages.length > 0" class="load-more-indicator">
      <span class="dot" />
      <span class="dot" />
      <span class="dot" />
    </div>

    <!-- Empty State -->
    <div v-if="messages.length === 0" class="empty-state">
      <div v-if="messagesLoading" class="messages-loading">
        <span class="dot" />
        <span class="dot" />
        <span class="dot" />
      </div>
      <template v-else>
        <div class="empty-avatar">
          <SparklesOutline />
        </div>
        <h3 class="empty-title">你好，有什么可以帮助你的？</h3>
        <p class="empty-desc">我是 AI 智能助手，请提出你的问题</p>

        <div class="suggestion-list">
          <button
            v-for="s in [
              { label: '系统架构', text: '请介绍系统的整体架构设计' },
              { label: 'API 接口', text: '列出所有可用的 API 接口' },
              { label: '权限说明', text: '解释权限系统的设计思路' },
            ]"
            :key="s.label"
            class="suggestion-chip"
            @click="emit('select-suggestion', s.text)"
          >
            {{ s.label }}
          </button>
        </div>
      </template>
    </div>

    <!-- Message List -->
    <div v-for="(msg, idx) in messages" :key="idx" class="message-wrapper">
      <!-- User -->
      <div v-if="msg.role === 'user'" class="message-row user-row">
        <div class="message-bubble user-bubble">
          <p class="message-text">{{ msg.content }}</p>
          <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
        </div>
      </div>

      <!-- Tool Result (non-bubble) -->
      <div v-else-if="msg.role === 'tool'" class="tool-row">
        <div class="tool-card">
          <div class="tool-card-header">
            <TerminalOutline class="tool-card-icon" />
            <span class="tool-card-title">{{ msg.content ? '工具结果' : '(空)' }}</span>
            <span v-if="msg.isStreaming" class="tool-card-spinner" />
          </div>
          <div v-if="msg.content" class="tool-card-body">
            <pre class="tool-card-code">{{ msg.content }}</pre>
          </div>
        </div>
      </div>

      <!-- Assistant -->
      <template v-else>
        <!-- Tool Call Cards (non-bubble, before content) -->
        <div v-if="msg.toolCalls?.length" class="tool-row">
          <div v-for="tc in msg.toolCalls" :key="tc.id" class="tool-card">
            <div class="tool-card-header">
              <TerminalOutline class="tool-card-icon" />
              <span class="tool-card-title">{{ tc.name || '工具调用' }}</span>
              <span v-if="tc.isRunning" class="tool-card-spinner" />
              <span v-else class="tool-card-check" />
            </div>
            <div class="tool-card-body">
              <div v-if="!argsEmpty(tc.arguments)" class="tool-card-section">
                <span class="tool-card-label">参数</span>
                <pre class="tool-card-code">{{ tc.arguments }}</pre>
              </div>
              <div v-if="tc.result !== undefined" class="tool-card-section">
                <span class="tool-card-label">结果</span>
                <pre class="tool-card-code">{{ tc.result }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Bubble -->
        <div v-if="msg.displayContent || msg.isStreaming" class="message-row ai-row">
          <div class="ai-avatar">
            <SparklesOutline />
          </div>
          <div class="message-bubble ai-bubble">
            <div v-if="msg.displayContent" class="markdown-body">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span v-html="renderMarkdown(msg.displayContent)" />
              <span v-if="msg.isStreaming" class="streaming-cursor">|</span>
            </div>
            <div v-else-if="msg.isStreaming" class="loading-dots">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
            </div>
            <div class="ai-meta">
              <span v-if="msg.usage" class="ai-usage">
                {{ msg.usage.totalTokens }} tokens
              </span>
              <span v-if="!msg.isStreaming && msg.displayContent" class="message-time">
                {{ formatTime(msg.timestamp) }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

/* ====== Load More ====== */
.load-more-indicator {
  display: flex;
  gap: 5px;
  padding: 8px 0;
  justify-content: center;
}

.load-more-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(230, 57, 124, 0.4);
  animation: dotBounce 1.4s ease-in-out infinite;
}

.messages-loading {
  display: flex;
  gap: 5px;
  padding: 40px 0;
  justify-content: center;
}

.messages-loading .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(230, 57, 124, 0.4);
  animation: dotBounce 1.4s ease-in-out infinite;
}
.messages-loading .dot:nth-child(2) { animation-delay: 0.2s; }
.messages-loading .dot:nth-child(3) { animation-delay: 0.4s; }

/* ====== Empty State ====== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px 40px;
  text-align: center;
}

.empty-avatar {
  width: 72px;
  height: 72px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(230, 57, 124, 0.2), rgba(230, 57, 124, 0.05));
  border: 1px solid rgba(230, 57, 124, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  color: #E6397C;
  margin-bottom: 20px;
  box-shadow: 0 0 40px rgba(230, 57, 124, 0.08);
  animation: emptyFloat 4s ease-in-out infinite;
}

@keyframes emptyFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 28px;
  font-weight: 400;
}

.suggestion-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.suggestion-chip {
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.suggestion-chip:hover {
  background: rgba(230, 57, 124, 0.1);
  border-color: rgba(230, 57, 124, 0.25);
  color: #E6397C;
  transform: translateY(-2px);
}

/* ====== Messages ====== */
.message-wrapper {
  display: contents;
}

.message-row {
  display: flex;
  gap: 12px;
  animation: msgFadeIn 0.35s ease;
}

@keyframes msgFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-row {
  justify-content: flex-end;
}

.ai-row {
  justify-content: flex-start;
}

.ai-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(230, 57, 124, 0.2), rgba(230, 57, 124, 0.05));
  border: 1px solid rgba(230, 57, 124, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E6397C;
  font-size: 16px;
  margin-top: 4px;
}

/* ====== Bubbles ====== */
.message-bubble {
  max-width: 72%;
  padding: 12px 16px;
  border-radius: 14px;
  position: relative;
}

.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
  word-break: break-word;
  white-space: pre-wrap;
}

.error-text {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  display: block;
  text-align: right;
}

.user-bubble {
  background: linear-gradient(135deg, rgba(230, 57, 124, 0.25), rgba(255, 92, 157, 0.12));
  border: 1px solid rgba(230, 57, 124, 0.15);
  border-bottom-right-radius: 4px;
}

.ai-bubble {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom-left-radius: 4px;
}

.ai-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.ai-usage {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  font-weight: 500;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* ====== Streaming Cursor ====== */
.streaming-cursor {
  display: inline-block;
  color: #E6397C;
  font-weight: 300;
  animation: blink 0.8s step-end infinite;
  margin-left: 1px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ====== Loading Dots ====== */
.loading-dots {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 4px 0;
}

.loading-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(230, 57, 124, 0.5);
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
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

/* ====== Markdown Body ====== */
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
  word-break: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
  &:last-child { margin-bottom: 0; }
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 16px 0 8px;
  font-weight: 700;
  color: #fff;
  line-height: 1.4;
}
.markdown-body :deep(h1) { font-size: 18px; }
.markdown-body :deep(h2) { font-size: 16px; }
.markdown-body :deep(h3) { font-size: 15px; }
.markdown-body :deep(h4) { font-size: 14px; }

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 4px 0 8px;
  padding-left: 20px;
}
.markdown-body :deep(li) {
  margin: 2px 0;
}

.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid rgba(230, 57, 124, 0.4);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0 6px 6px 0;
  color: rgba(255, 255, 255, 0.6);
}

.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(230, 57, 124, 0.1);
  color: #FF5C9D;
}

.markdown-body :deep(pre) {
  margin: 8px 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
}

.markdown-body :deep(a) {
  color: #E6397C;
  text-decoration: none;
  transition: opacity 0.2s;
}
.markdown-body :deep(a:hover) {
  opacity: 0.8;
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  margin: 12px 0;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.markdown-body :deep(th) {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.markdown-body :deep(td) {
  color: rgba(255, 255, 255, 0.65);
}

.markdown-body :deep(strong) {
  color: #fff;
  font-weight: 700;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

.markdown-body :deep(input[type="checkbox"]) {
  margin-right: 6px;
  accent-color: #E6397C;
}

/* ====== Tool Calls / Results ====== */
.tool-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: msgFadeIn 0.35s ease;
  max-width: 80%;
}

.tool-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-left: 2px solid rgba(230, 57, 124, 0.4);
  border-radius: 8px;
  overflow: hidden;
}

.tool-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.tool-card-icon {
  width: 16px;
  height: 16px;
  color: rgba(230, 57, 124, 0.6);
  flex-shrink: 0;
}

.tool-card-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  text-transform: lowercase;
}

.tool-card-spinner {
  width: 12px;
  height: 12px;
  margin-left: auto;
  border: 2px solid rgba(230, 57, 124, 0.2);
  border-top-color: #E6397C;
  border-radius: 50%;
  animation: toolSpin 0.7s linear infinite;
}

.tool-card-check {
  width: 12px;
  height: 12px;
  margin-left: auto;
  position: relative;
}

.tool-card-check::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(80, 200, 120, 0.5);
  box-shadow: 0 0 6px rgba(80, 200, 120, 0.3);
}

@keyframes toolSpin {
  to { transform: rotate(360deg); }
}

.tool-card-body {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-card-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tool-card-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.25);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tool-card-code {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .chat-messages {
    padding: 16px;
  }
  .message-bubble {
    max-width: 88%;
  }
  .empty-state {
    padding: 40px 16px 30px;
  }
  .suggestion-list {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
