<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found-page">
    <div class="not-found-bg" />
    <div class="not-found-content">
      <h1 class="not-found-code">404</h1>
      <p class="not-found-desc">页面不存在</p>
      <n-button type="primary" size="large" round class="not-found-btn" @click="router.push('/dashboard')">
        返回首页
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1A1A1D;
  overflow: hidden;
}

.not-found-bg {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(230, 57, 124, 0.12), transparent 70%);
  filter: blur(60px);
  animation: pulse 6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
}

.not-found-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.not-found-code {
  font-size: 120px;
  font-weight: 800;
  color: transparent;
  background: linear-gradient(135deg, #E6397C, #ff8cb3);
  -webkit-background-clip: text;
  background-clip: text;
  line-height: 1;
  margin: 0;
  filter: drop-shadow(0 0 40px rgba(230, 57, 124, 0.3));
}

.not-found-desc {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin: 16px 0 32px;
}

.not-found-btn {
  padding: 0 32px;
}
</style>
