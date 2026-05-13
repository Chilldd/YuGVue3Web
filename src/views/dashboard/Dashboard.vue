<script setup lang="ts">
import { NCard, NGrid, NGi, NIcon } from 'naive-ui'
import {
  PeopleOutline,
  CartOutline,
  TrendingUpOutline,
  AlertCircleOutline,
} from '@vicons/ionicons5'

const statsCards = [
  { title: '用户总数', value: '1,234', icon: PeopleOutline, color: '#E6397C' },
  { title: '订单总数', value: '856', icon: CartOutline, color: '#f59e0b' },
  { title: '本周增长', value: '12.5%', icon: TrendingUpOutline, color: '#10b981' },
  { title: '待处理', value: '23', icon: AlertCircleOutline, color: '#ef4444' },
]
</script>

<template>
  <div class="dashboard">

    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="welcome-bg-pattern" />
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">欢迎回来</h1>
          <p class="welcome-desc">这是今天的运营概览</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :screen-s="2" :screen-m="2">
      <n-gi v-for="card in statsCards" :key="card.title">
        <n-card :bordered="false" class="stat-card">
          <div class="stat-content">
            <div class="stat-left">
              <div class="stat-icon" :style="{ background: `${card.color}14`, color: card.color }">
                <n-icon :size="22">
                  <component :is="card.icon" />
                </n-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">{{ card.title }}</span>
                <span class="stat-value">{{ card.value }}</span>
              </div>
            </div>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill" :style="{ width: '65%', background: card.color }" />
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Two columns -->
    <div class="content-grid">
      <n-card :bordered="false" class="section-card" title="最近活动">
        <div class="activity-list">
          <div class="activity-row">
            <div class="activity-dot dot-info" />
            <div class="activity-body">
              <span class="activity-action">新用户注册</span>
              <span class="activity-time">5 分钟前</span>
            </div>
          </div>
          <div class="activity-row">
            <div class="activity-dot dot-success" />
            <div class="activity-body">
              <span class="activity-action">订单 #10234 已完成</span>
              <span class="activity-time">12 分钟前</span>
            </div>
          </div>
          <div class="activity-row">
            <div class="activity-dot dot-warning" />
            <div class="activity-body">
              <span class="activity-action">系统备份完成</span>
              <span class="activity-time">2 小时前</span>
            </div>
          </div>
        </div>
      </n-card>

      <n-card :bordered="false" class="section-card" title="系统状态">
        <div class="status-list">
          <div class="status-item">
            <span class="status-label">CPU 使用率</span>
            <div class="status-bar-bg"><div class="status-bar-fill" style="width:32%" /></div>
          </div>
          <div class="status-item">
            <span class="status-label">内存使用</span>
            <div class="status-bar-bg"><div class="status-bar-fill fill-pink" style="width:58%" /></div>
          </div>
          <div class="status-item">
            <span class="status-label">磁盘空间</span>
            <div class="status-bar-bg"><div class="status-bar-fill" style="width:41%" /></div>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Welcome Banner */
.welcome-banner {
  position: relative;
  border-radius: 16px;
  padding: 28px 32px;
  background: linear-gradient(135deg, var(--brand-dark) 0%, #2d1a24 50%, var(--brand-dark) 100%);
  overflow: hidden;
}
.welcome-bg-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  background-image:
    radial-gradient(circle at 20% 50%, var(--brand-pink) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(230, 57, 124, 0.4) 0%, transparent 40%);
  animation: bgDrift 8s ease-in-out infinite alternate;
}
@keyframes bgDrift {
  0% { transform: scale(1); }
  100% { transform: scale(1.1) translate(-10px, -5px); }
}
.welcome-content {
  position: relative;
  z-index: 1;
}
.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}
.welcome-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

/* Stats Cards */
.stat-card {
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.25s;
}
.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}
.stat-content {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}
.stat-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--brand-dark);
  line-height: 1.2;
}
.stat-bar {
  width: 100%;
  height: 3px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 2px;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 960px) {
  .content-grid { grid-template-columns: 1fr; }
}
.section-card {
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* Activity */
.activity-list {
  display: flex;
  flex-direction: column;
}
.activity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f5;
}
.activity-row:last-child {
  border-bottom: none;
}
.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-info { background: var(--brand-pink); box-shadow: 0 0 6px rgba(230, 57, 124, 0.4); }
.dot-success { background: var(--green); box-shadow: 0 0 6px rgba(16, 185, 129, 0.4); }
.dot-warning { background: var(--yellow); box-shadow: 0 0 6px rgba(245, 158, 11, 0.4); }
.activity-body {
  display: flex;
  justify-content: space-between;
  flex: 1;
}
.activity-action {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.activity-time {
  font-size: 12px;
  color: #aaa;
}

/* Status */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.status-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.status-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}
.status-bar-bg {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}
.status-bar-bg .status-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: #E6397C;
  transition: width 0.6s;
}
.status-bar-bg .status-bar-fill.fill-pink {
  background: linear-gradient(90deg, #f59e0b, #E6397C);
}
</style>
