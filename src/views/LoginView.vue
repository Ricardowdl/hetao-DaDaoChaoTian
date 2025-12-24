<template>
  <div class="login-container">
    <div class="bg-layer" />

    <div class="login-panel">
      <div class="title">{{ isRegister ? '初入道门' : '登入洞天' }}</div>
      <div class="sub">{{ isRegister ? '注册新道号，踏入修仙之路。' : '验证道友身份，以便同步云端天机。' }}</div>

      <form class="form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="label">道号</label>
          <input class="input" v-model.trim="username" autocomplete="username" required />
        </div>

        <div class="form-group">
          <label class="label">身份令牌</label>
          <input class="input" v-model.trim="password" type="password" autocomplete="current-password" required />
        </div>

        <div v-if="isRegister" class="form-group">
          <label class="label">请再次输入令牌</label>
          <input class="input" v-model.trim="password2" type="password" autocomplete="new-password" required />
        </div>

        <div class="form-group turnstile-container">
          <div ref="turnstileContainer" class="turnstile-placeholder">
            <div class="turnstile-title">Cloudflare Turnstile</div>
            <div class="turnstile-sub">如需联机功能，请在正式版接入验证组件</div>
          </div>
        </div>

        <div v-if="statusText" class="status">{{ statusText }}</div>

        <button class="btn primary" type="submit" :disabled="submitting">
          {{ submitting ? '处理中...' : isRegister ? '注册' : '登入' }}
        </button>

        <button class="btn" type="button" @click="toggleMode">
          {{ isRegister ? '已有道号？立即登入' : '初来乍到？注册道号' }}
        </button>

        <button class="btn ghost" type="button" @click="goBack">返回</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const isRegister = ref(false)
const username = ref('')
const password = ref('')
const password2 = ref('')

const submitting = ref(false)
const statusText = ref('')

const turnstileContainer = ref<HTMLElement | null>(null)
let turnstileWidgetId: any = null

function goBack() {
  router.push({ name: 'ModeSelection' })
}

function toggleMode() {
  isRegister.value = !isRegister.value
  statusText.value = ''
  password.value = ''
  password2.value = ''

  nextTick(() => {
    if (turnstileWidgetId && (window as any).turnstile?.reset) {
      ;(window as any).turnstile.reset(turnstileWidgetId)
    }
  })
}

async function renderTurnstile() {
  if (!turnstileContainer.value) return
  const w: any = window as any
  if (!w.turnstile?.render) return

  try {
    if (turnstileWidgetId && w.turnstile.reset) {
      w.turnstile.reset(turnstileWidgetId)
      return
    }

    turnstileWidgetId = w.turnstile.render(turnstileContainer.value, {
      sitekey: '0x4AAAAAABsSt_IBcfz18lmt',
      callback: (_token: string) => {
        void _token
      }
    })
  } catch {
    void 0
  }
}

async function handleSubmit() {
  statusText.value = ''

  if (isRegister.value && password.value !== password2.value) {
    statusText.value = '两次输入令牌不一致'
    return
  }

  submitting.value = true
  try {
    statusText.value = '当前版本仅复刻 UI，登录/注册逻辑未接入。'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  renderTurnstile()
})

onUnmounted(() => {
  const w: any = window as any
  if (turnstileWidgetId && w.turnstile?.remove) {
    try {
      w.turnstile.remove(turnstileWidgetId)
    } catch {
      void 0
    }
  }
  turnstileWidgetId = null
})
</script>

<style scoped>
.login-container {
  width: 100%;
  height: var(--app-vh, 100vh);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1100px 700px at 50% 0%, rgba(147, 51, 234, 0.22), transparent 60%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.4), rgba(2, 6, 23, 0.9));
  filter: brightness(0.9);
}

.login-panel {
  position: relative;
  z-index: 1;
  width: min(520px, 100%);
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
  padding: 26px;
  display: grid;
  gap: 12px;
  box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.6);
}

.title {
  font-size: 22px;
  color: var(--text-1);
}

.sub {
  color: var(--text-3);
  font-size: 13px;
  line-height: 1.5;
}

.form {
  display: grid;
  gap: 12px;
}

.form-group {
  display: grid;
  gap: 6px;
}

.label {
  color: var(--text-2);
  font-size: 12px;
}

.input {
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 10px 12px;
  outline: none;
}

.input:focus {
  border-color: rgba(147, 51, 234, 0.55);
}

.turnstile-placeholder {
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  padding: 12px;
  color: var(--text-2);
  background: rgba(255, 255, 255, 0.03);
}

.turnstile-title {
  font-size: 12px;
  color: var(--text-2);
}

.turnstile-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}

.status {
  font-size: 12px;
  color: var(--warn);
}

.btn {
  appearance: none;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 10px 12px;
  cursor: pointer;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.btn.primary {
  background: rgba(147, 51, 234, 0.22);
  border-color: rgba(147, 51, 234, 0.55);
}

.btn.primary:hover {
  background: rgba(147, 51, 234, 0.3);
}

.btn.ghost {
  background: transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
