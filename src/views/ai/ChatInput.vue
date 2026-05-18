<script setup lang="ts">
import { ref } from 'vue'
import { SendOutline, StopCircleOutline } from '@vicons/ionicons5'

defineOptions({ name: 'ChatInput' })

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  stop: []
}>()

const inputText = ref('')

function handleSend() {
  const text = inputText.value.trim()
  if (!text || props.loading) return
  emit('send', text)
  inputText.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (props.loading) return
    handleSend()
  }
}
</script>

<template>
  <div class="chat-input-bar">
    <div class="input-container" :class="{ 'is-loading': loading }">
      <input
        v-model="inputText"
        class="chat-input"
        type="text"
        placeholder="输入你的问题..."
        :disabled="loading"
        @keydown="handleKeydown"
      >
      <button
        v-if="loading"
        class="send-btn stop-btn"
        @click="emit('stop')"
      >
        <StopCircleOutline />
      </button>
      <button
        v-else
        class="send-btn"
        :class="{ 'send-active': !!inputText.trim() }"
        :disabled="!inputText.trim()"
        @click="handleSend"
      >
        <SendOutline />
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-input-bar {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  background: rgba(26, 26, 29, 0.8);
  backdrop-filter: blur(20px);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 4px;
  transition: all 0.3s ease;
}

.input-container:focus-within {
  border-color: rgba(230, 57, 124, 0.3);
  box-shadow: 0 0 20px rgba(230, 57, 124, 0.06);
  background: rgba(255, 255, 255, 0.06);
}

.input-container.is-loading {
  border-color: rgba(230, 57, 124, 0.2);
  background: rgba(255, 255, 255, 0.02);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px 14px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  font-family: inherit;
  line-height: 1.5;
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.chat-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-btn svg {
  width: 24px;
  height: 24px;
}

.send-btn:disabled {
  cursor: not-allowed;
}

.send-btn.send-active {
  background: linear-gradient(135deg, #E6397C, #FF5C9D);
  color: #fff;
  box-shadow: 0 0 20px rgba(230, 57, 124, 0.25);
}

.send-btn.send-active:hover {
  box-shadow: 0 0 30px rgba(230, 57, 124, 0.35);
  transform: scale(1.05);
}

.send-btn.send-active:active {
  transform: scale(0.95);
}

.stop-btn {
  background: rgba(230, 57, 124, 0.15);
  color: #E6397C;
}

.stop-btn svg {
  width: 24px;
  height: 24px;
}

.stop-btn:hover {
  background: rgba(230, 57, 124, 0.25);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .chat-input-bar {
    padding: 12px 16px;
  }
}
</style>
