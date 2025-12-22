<template>
  <div class="wrap">
    <div class="topbar">
      <div class="title">世界生成失败</div>
      <div class="actions">
        <button class="btn" type="button" @click="goCreation">返回创角</button>
        <button class="btn" type="button" @click="goDebug">打开世界生成调试</button>
        <button class="btn danger" type="button" @click="clearAndGoBack">清空并返回</button>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">摘要</div>
        <div class="kv">
          <div class="k">阶段</div>
          <div class="v">{{ payload?.stage || '-' }}</div>
          <div class="k">时间</div>
          <div class="v">{{ payload?.createdAt || '-' }}</div>
        </div>

        <div class="card-sub">错误信息</div>
        <pre class="pre err">{{ payload?.message || '未捕获到错误信息' }}</pre>

        <div v-if="payload?.stack" class="card-sub">堆栈</div>
        <pre v-if="payload?.stack" class="pre">{{ payload?.stack }}</pre>

        <div class="card-sub">操作</div>
        <div class="buttons">
          <button class="btn primary" type="button" :disabled="!payload" @click="copyAll">复制全部JSON</button>
          <button class="btn" type="button" :disabled="!payload?.message" @click="copyMessage">复制错误信息</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Provider 失败记录</div>
        <div v-if="!providerErrors.length" class="muted">无（可能在本地生成阶段失败或未记录）</div>
        <div v-for="(p, idx) in providerErrors" :key="idx" class="provider">
          <div class="provider-head">
            <span class="tag">{{ p.provider }}</span>
          </div>
          <pre class="pre err">{{ p.message }}</pre>
          <pre v-if="p.stack" class="pre">{{ p.stack }}</pre>
        </div>
      </div>

      <div class="card full">
        <div class="card-title">生成输入参数（用于复现）</div>
        <pre class="pre out">{{ inputText }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useWorldGenErrorStore } from '../stores/useWorldGenErrorStore'

const router = useRouter()
const errStore = useWorldGenErrorStore()

onMounted(() => {
  errStore.hydrateFromSession()
})

const payload = computed(() => errStore.lastError)
const providerErrors = computed(() => (Array.isArray(payload.value?.providerErrors) ? payload.value!.providerErrors! : []))
const inputText = computed(() => {
  const v = payload.value?.input
  if (!v) return ''
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
})

async function copyAll() {
  if (!payload.value) return
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload.value, null, 2))
  } catch {
  }
}

async function copyMessage() {
  const msg = payload.value?.message
  if (!msg) return
  try {
    await navigator.clipboard.writeText(msg)
  } catch {
  }
}

function goCreation() {
  router.push({ name: 'CharacterCreation' })
}

function goDebug() {
  router.push({ name: 'WorldGenDebug' })
}

function clearAndGoBack() {
  errStore.clear()
  router.push({ name: 'CharacterCreation' })
}
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  padding: 16px;
  background: rgba(2, 6, 23, 0.92);
  color: rgba(226, 232, 240, 0.92);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(10px);
}

.title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card {
  border-radius: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(10px);
}

.full {
  grid-column: 1 / -1;
}

.card-title {
  font-weight: 700;
  margin-bottom: 10px;
}

.card-sub {
  font-weight: 700;
  margin: 10px 0 6px;
}

.kv {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 6px 10px;
  margin-bottom: 10px;
}

.k {
  color: rgba(148, 163, 184, 0.92);
}

.v {
  color: rgba(226, 232, 240, 0.92);
}

.pre {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(2, 6, 23, 0.55);
  padding: 10px;
  overflow: auto;
  max-height: 360px;
  white-space: pre-wrap;
  word-break: break-word;
}

.err {
  border-color: rgba(248, 113, 113, 0.28);
  background: rgba(248, 113, 113, 0.08);
}

.out {
  max-height: 520px;
}

.buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.35);
  color: rgba(226, 232, 240, 0.92);
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.24), rgba(99, 102, 241, 0.18));
  border-color: rgba(56, 189, 248, 0.28);
}

.danger {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.12);
}

.muted {
  color: rgba(148, 163, 184, 0.9);
}

.provider {
  margin-top: 10px;
}

.provider-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.4);
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
