<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const remember = ref(true)

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    message.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await authStore.loginAction(form.value)
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.push(redirect)
    message.success('登录成功')
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail || error.response?.data?.message
      message.error(detail || '登录失败，请检查用户名和密码')
    } else {
      message.error('登录失败，请检查用户名和密码')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-root">

    <!-- Background glow blobs -->
    <div class="glow glow-1" />
    <div class="glow glow-2" />

    <!-- Floating particles -->
    <div class="particle p1" />
    <div class="particle p2" />
    <div class="particle p3" />
    <div class="particle p4" />
    <div class="particle p5" />
    <div class="particle p6" />
    <div class="particle p7" />
    <div class="particle p8" />

    <!-- Main grid -->
    <div class="grid-wrap">
      <!-- Left: Hero -->
      <div class="hero">
        <div class="hero-badge">WELCOME BACK</div>

        <h1 class="hero-title">
          Future<br>
          <span class="hero-accent">Login</span>
        </h1>

        <p class="hero-desc">
          极致暗黑美学与丝滑交互动效融合，<br>
          打造具有未来感与高级质感的登录体验。
        </p>

        <!-- Rotating decorative ring -->
        <div class="hero-ring" />
      </div>

      <!-- Right: Login Card -->
      <div class="card-wrap">
        <div class="card-glow" />
        <div class="card">
          <h2 class="card-title">欢迎回来</h2>
          <p class="card-desc">登录你的账号，继续你的旅程</p>

          <form class="form" @submit.prevent="handleLogin">
            <div class="field">
              <label class="field-label">用户名</label>
              <div class="input-box">
                <input
                  v-model="form.username"
                  type="text"
                  placeholder="请输入用户名"
                  :disabled="loading"
                  class="input-el"
                />
              </div>
            </div>

            <div class="field">
              <label class="field-label">密码</label>
              <div class="input-box">
                <input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  :disabled="loading"
                  class="input-el"
                />
              </div>
            </div>

            <div class="options-row">
              <label class="remember-label">
                <input v-model="remember" type="checkbox" class="remember-checkbox" />
                <span>记住我</span>
              </label>
              <a href="#" class="forgot-link" @click.prevent>忘记密码？</a>
            </div>

            <button type="submit" class="login-btn" :disabled="loading">
              <span class="btn-shine" />
              <span>{{ loading ? '登录中…' : '登录' }}</span>
            </button>
          </form>

          <div class="divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div class="social-row">
            <button class="social-btn" @click.prevent>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </button>
            <button class="social-btn" @click.prevent>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
          </div>

          <p class="signup-hint">
            还没有账号？<a href="#" @click.prevent>立即注册</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== Font ========== */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ========== Root ========== */
.login-root {
  --bg: #1A1A1D;
  --bg-card: rgba(28, 28, 32, 0.72);
  --primary: #E6397C;
  --primary-light: #ff5b99;
  --text: #ffffff;
  --text-gray: #a1a1aa;
  --line: rgba(255, 255, 255, 0.08);

  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;
  color: var(--text);

  background:
    radial-gradient(circle at 20% 20%, rgba(230, 57, 124, 0.15), transparent 30%),
    radial-gradient(circle at 80% 80%, rgba(230, 57, 124, 0.12), transparent 30%),
    linear-gradient(135deg, #161618 0%, #1A1A1D 40%, #111114 100%);
}

/* ========== Glow Blobs ========== */
.glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(230, 57, 124, 0.18), transparent 70%);
  filter: blur(40px);
  animation: glowPulse 8s ease-in-out infinite;
  pointer-events: none;
}
.glow-1 {
  top: -200px;
  left: -100px;
}
.glow-2 {
  bottom: -250px;
  right: -100px;
  animation-delay: 2s;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* ========== Particles ========== */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(230, 57, 124, 0.5);
  border-radius: 50%;
  animation: particleFloat 14s linear infinite;
  pointer-events: none;
}
.p1 { left: 8%;  animation-delay: 0s; }
.p2 { left: 20%; animation-delay: 2.5s; }
.p3 { left: 35%; animation-delay: 5s; }
.p4 { left: 55%; animation-delay: 1.2s; }
.p5 { left: 70%; animation-delay: 4s; }
.p6 { left: 82%; animation-delay: 3s; }
.p7 { left: 45%; animation-delay: 7s; }
.p8 { left: 92%; animation-delay: 6s; }

@keyframes particleFloat {
  from { transform: translateY(100vh); opacity: 0; }
  10% { opacity: 1; }
  to { transform: translateY(-120vh); opacity: 0; }
}

/* ========== Grid Layout ========== */
.grid-wrap {
  width: 1280px;
  max-width: 95%;
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 80px;
  align-items: center;
  position: relative;
  z-index: 2;
}

/* ========== Left Hero ========== */
.hero {
  position: relative;
  animation: fadeUp 1s ease;
}

.hero-badge {
  color: var(--primary);
  font-size: 14px;
  letter-spacing: 6px;
  text-transform: uppercase;
  margin-bottom: 24px;
  font-weight: 500;
  animation: fadeUp 1s ease;
}

.hero-title {
  font-size: 82px;
  line-height: 1;
  margin-bottom: 28px;
  font-weight: 700;
  animation: fadeUp 1.2s ease;
}

.hero-accent {
  color: var(--primary);
  text-shadow: 0 0 30px rgba(230, 57, 124, 0.45);
}

.hero-desc {
  max-width: 520px;
  color: var(--text-gray);
  line-height: 1.8;
  font-size: 17px;
  animation: fadeUp 1.4s ease;
}

/* Rotating ring */
.hero-ring {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  border: 2px solid rgba(230, 57, 124, 0.5);
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 40px rgba(230, 57, 124, 0.25),
    inset 0 0 40px rgba(230, 57, 124, 0.1);
  animation: ringRotate 20s linear infinite;
  pointer-events: none;
}
.hero-ring::before {
  content: '';
  position: absolute;
  inset: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

@keyframes ringRotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* ========== Card ========== */
.card-wrap {
  position: relative;
  animation: cardSlide 1s ease;
}

.card-glow {
  position: absolute;
  inset: 0;
  border-radius: 32px;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(230,57,124,0.08), transparent);
  filter: blur(20px);
  opacity: 0.5;
  z-index: 0;
}

.card {
  position: relative;
  background: var(--bg-card);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 32px;
  padding: 48px;
  border: 1px solid var(--line);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.45),
    0 0 80px rgba(230, 57, 124, 0.06);
  overflow: hidden;
  z-index: 1;
}

/* Gradient border overlay */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 32px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(230,57,124,0.2), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.card-title {
  font-size: 34px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.2;
}

.card-desc {
  color: var(--text-gray);
  margin-bottom: 40px;
  font-size: 15px;
}

/* ========== Form ========== */
.field {
  margin-bottom: 22px;
}

.field-label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.input-box {
  position: relative;
}

.input-el {
  width: 100%;
  height: 58px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 0 20px;
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: all 0.35s ease;
}

.input-el:focus {
  border-color: rgba(230, 57, 124, 0.8);
  box-shadow:
    0 0 0 4px rgba(230, 57, 124, 0.12),
    0 0 30px rgba(230, 57, 124, 0.15);
  transform: translateY(-1px);
}

.input-el::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.input-el:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== Options Row ========== */
.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0 30px;
  font-size: 14px;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-gray);
  cursor: pointer;
}

.remember-checkbox {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
}

.forgot-link {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.3s;
  font-size: 14px;
}
.forgot-link:hover {
  color: var(--primary-light);
}

/* ========== Button ========== */
.login-btn {
  width: 100%;
  height: 60px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.35s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -120%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.8s ease;
  pointer-events: none;
}

.login-btn:hover:not(:disabled) .btn-shine {
  left: 120%;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 35px rgba(230, 57, 124, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

/* ========== Divider ========== */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 30px 0;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

/* ========== Social Buttons ========== */
.social-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.social-btn {
  height: 56px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.02);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.social-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(230, 57, 124, 0.35);
  background: rgba(230, 57, 124, 0.08);
}

.social-btn svg {
  opacity: 0.7;
}

/* ========== Signup ========== */
.signup-hint {
  margin-top: 30px;
  text-align: center;
  color: var(--text-gray);
  font-size: 14px;
}

.signup-hint a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}
.signup-hint a:hover {
  color: var(--primary-light);
}

/* ========== Animations ========== */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes cardSlide {
  from { opacity: 0; transform: translateX(80px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ========== Responsive ========== */
@media (max-width: 980px) {
  .grid-wrap {
    grid-template-columns: 1fr;
  }
  .hero {
    display: none;
  }
  .card-wrap {
    width: 100%;
    max-width: 460px;
    margin: auto;
  }
}

@media (max-width: 520px) {
  .card {
    padding: 32px 24px;
    border-radius: 24px;
  }
  .card-title {
    font-size: 28px;
  }
  .hero-ring { display: none; }
}

/* ========== Reduce Motion ========== */
@media (prefers-reduced-motion: reduce) {
  .glow, .particle, .hero-ring, .hero, .card-wrap {
    animation: none !important;
  }
  .glow { opacity: 0.7; }
  .particle { display: none; }
}
</style>
