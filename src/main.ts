import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupRouterGuard } from './router/guards'
import './assets/main.css'

const app = createApp(App)

// 全局 Vue 错误处理 — 抑制 Naive UI 在路由切换时的 DOM 渲染异常
app.config.errorHandler = (err) => {
  if (err instanceof Error && err.message?.includes?.('parentNode')) {
    return
  }
  console.error(err)
}

// 全局未捕获 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes?.('parentNode')) {
    event.preventDefault()
  }
})

app.use(createPinia())
app.use(router)

setupRouterGuard(router)

app.mount('#app')
