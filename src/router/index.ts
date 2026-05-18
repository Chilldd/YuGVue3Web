import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/Dashboard.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'system/resources',
          name: 'resources',
          component: () => import('@/views/system/resources/ResourceManagement.vue'),
          meta: { title: '资源管理' },
        },
        {
          path: 'system/users',
          name: 'users',
          component: () => import('@/views/system/users/UserManagement.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'system/roles',
          name: 'roles',
          component: () => import('@/views/system/roles/RoleManagement.vue'),
          meta: { title: '角色管理' },
        },
        {
          path: 'system/tools',
          name: 'tools',
          component: () => import('@/views/system/tools/ToolPage.vue'),
          meta: { title: '后端工具' },
        },
        {
          path: 'ai/chat',
          name: 'ai-chat',
          component: () => import('@/views/ai/Chat.vue'),
          meta: { title: 'AI 智能对话' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/error/NotFound.vue'),
    },
  ],
})

export default router
