/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    /** 关联的资源 Page ID，用于加载页面 API 权限 */
    pageId?: number
  }
}

export {}
