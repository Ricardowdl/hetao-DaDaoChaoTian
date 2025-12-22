<template>
  <div v-if="store.visible" class="progress-overlay">
    <div class="progress-page">
      <div class="topbar">
        <div class="title">{{ store.title || '处理中' }}</div>
        <div class="actions">
          <button class="btn" type="button" @click="store.close">关闭</button>
        </div>
      </div>

      <div class="body">
        <div class="left">
          <div class="section-title">步骤</div>
          <div class="steps">
            <div v-for="(s, idx) in store.steps" :key="s.id" class="step" :class="s.status">
              <div class="step-head">
                <div class="idx">{{ idx + 1 }}</div>
                <div class="main">
                  <div class="step-title">{{ s.title }}</div>
                  <div v-if="s.detail" class="step-detail">{{ s.detail }}</div>
                </div>
              </div>
              <div class="meta">
                <span class="tag">{{ statusLabel(s.status) }}</span>
              </div>
            </div>
          </div>

          <div v-if="store.error" class="error">
            {{ store.error }}
          </div>

          <div v-if="store.done" class="done">
            已完成
          </div>
        </div>

        <div class="right">
          <div class="section-title">输出</div>
          <pre class="output">{{ store.output }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProgressStore } from '../stores/useProgressStore'

const store = useProgressStore()

function statusLabel(status: string) {
  if (status === 'in_progress') return '进行中'
  if (status === 'completed') return '完成'
  if (status === 'error') return '失败'
  return '等待'
}
</script>

<style scoped>
.progress-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: stretch;
}

.progress-page {
  width: min(1200px, 100%);
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--panel-border);
}

.title {
  font-size: 16px;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.95);
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(15, 23, 42, 0.9);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.body {
  flex: 1;
  display: grid;
  grid-template-columns: 360px 1fr;
  min-height: 0;
}

.left {
  border-right: 1px solid var(--panel-border);
  padding: 12px;
  overflow: auto;
}

.right {
  padding: 12px;
  overflow: auto;
}

.section-title {
  font-weight: 700;
  margin-bottom: 10px;
  color: rgba(15, 23, 42, 0.85);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 10px;
}

.step.in_progress {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(239, 246, 255, 0.75);
}

.step.completed {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(240, 253, 244, 0.75);
}

.step.error {
  border-color: rgba(239, 68, 68, 0.45);
  background: rgba(254, 242, 242, 0.85);
}

.step-head {
  display: flex;
  gap: 10px;
}

.idx {
  width: 26px;
  height: 26px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.06);
}

.step-title {
  font-weight: 800;
  color: rgba(15, 23, 42, 0.92);
}

.step-detail {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(71, 85, 105, 0.9);
  white-space: pre-wrap;
}

.meta {
  margin-top: 8px;
}

.tag {
  display: inline-block;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.8);
}

.output {
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 12px;
  min-height: 260px;
}

.error {
  margin-top: 12px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(254, 242, 242, 0.9);
  color: rgba(153, 27, 27, 0.95);
  white-space: pre-wrap;
}

.done {
  margin-top: 10px;
  font-weight: 800;
  color: rgba(21, 128, 61, 0.95);
}
</style>
