<template>
  <div v-if="modelValue" class="auth-modal-overlay" @click.self="close">
    <div class="auth-modal">
      <div class="auth-header">
        <h3 class="auth-title">🔐 授权验证</h3>
        <button class="icon-btn" aria-label="关闭" @click="close">✕</button>
      </div>

      <div class="auth-body">
        <div class="form-row">
          <label class="form-label">应用 ID</label>
          <input v-model.trim="appId" class="form-input" type="text" placeholder="请输入应用ID" :disabled="busy" />
        </div>

        <div class="form-row">
          <label class="form-label">兑换码</label>
          <input v-model.trim="code" class="form-input" type="text" placeholder="请输入兑换码" :disabled="busy" />
        </div>

        <div class="form-row">
          <label class="form-label">机器码</label>
          <div class="machine-row">
            <input v-model.trim="machineCode" class="form-input" type="text" placeholder="自动生成或手动输入" :disabled="busy" />
            <button class="btn btn-ghost" type="button" :disabled="busy" @click="generateCode">🔄</button>
          </div>
          <div class="hint">使用统一机器码系统自动生成</div>
        </div>

        <div class="form-row">
          <label class="form-label">绑定类型</label>
          <select v-model="bindingType" class="form-select" :disabled="busy">
            <option value="machine">仅机器码</option>
            <option value="ip">仅IP</option>
            <option value="both">双重绑定</option>
          </select>
        </div>

        <div v-if="message" class="message" :class="messageType">{{ message }}</div>
      </div>

      <div class="auth-footer">
        <button class="btn btn-ghost" type="button" :disabled="busy" @click="close">取消</button>
        <button class="btn btn-primary" type="button" :disabled="busy || !canVerify" @click="verify">验证授权</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useAuthStore } from '../stores/useAuthStore'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'verified'): void
}>()

const authStore = useAuthStore()

const busy = ref(false)
const message = ref('')
const messageType = ref<'ok' | 'err'>('ok')

const appId = ref(authStore.appId)
const code = ref('')
const machineCode = ref(authStore.machineCode)
const bindingType = ref<'machine' | 'ip' | 'both'>('machine')

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    message.value = ''
    messageType.value = 'ok'
    appId.value = authStore.appId
    machineCode.value = authStore.machineCode
    await authStore.ensureMachineCode()
    machineCode.value = authStore.machineCode
  }
)

const canVerify = computed(() => Boolean(appId.value && code.value && machineCode.value))

function close() {
  emit('update:modelValue', false)
}

async function generateCode() {
  try {
    busy.value = true
    await authStore.ensureMachineCode()
    machineCode.value = authStore.machineCode
  } catch {
    messageType.value = 'err'
    message.value = '机器码生成失败'
  } finally {
    busy.value = false
  }
}

async function verify() {
  try {
    busy.value = true
    message.value = ''
    const result = await authStore.verifyAuth({
      appId: appId.value,
      code: code.value,
      machineCode: machineCode.value,
      bindingType: bindingType.value
    })

    messageType.value = result.success ? 'ok' : 'err'
    message.value = result.message

    if (result.success) {
      emit('verified')
      setTimeout(() => close(), 300)
    }
  } catch (e) {
    messageType.value = 'err'
    message.value = e instanceof Error ? `网络请求失败：${e.message}` : '网络请求失败，请检查服务器连接'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.65);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 50;
}

.auth-modal {
  width: min(520px, 100%);
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--panel-border);
}

.auth-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}

.icon-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.auth-body {
  padding: 14px 16px;
  display: grid;
  gap: 12px;
}

.form-row {
  display: grid;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  color: var(--text-3);
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: rgba(2, 6, 23, 0.25);
  color: var(--text-1);
  outline: none;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.15);
}

.machine-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.hint {
  font-size: 12px;
  color: var(--text-3);
}

.message {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  font-size: 13px;
}

.message.ok {
  color: var(--ok);
  background: rgba(16, 185, 129, 0.08);
}

.message.err {
  color: var(--err);
  background: rgba(248, 113, 113, 0.08);
}

.auth-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--panel-border);
}

.btn {
  appearance: none;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  color: var(--text-1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.04);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

.btn-primary {
  background: rgba(30, 58, 138, 0.35);
  border-color: var(--accent-strong);
}

.btn-primary:hover:not(:disabled) {
  background: rgba(30, 58, 138, 0.5);
}
</style>
