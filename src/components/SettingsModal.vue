<template>
  <div v-if="modelValue" class="settings-overlay" @click.self="close">
    <div class="settings-modal">
      <div class="nav">
        <button class="nav-btn" type="button" aria-label="返回" @click="close">←</button>
        <div class="nav-title">
          <span class="nav-ico">⚙</span>
          <span>系统设置</span>
        </div>
        <div class="nav-right" />
      </div>

      <div class="settings-body">
        <div class="hero">
          <div class="hero-left">
            <div class="hero-ico">⚙</div>
            <div>
              <div class="hero-title">游戏设置</div>
              <div class="hero-sub">自定义你的游戏体验</div>
            </div>
          </div>
          <div class="hero-actions">
            <button class="btn btn-ghost" type="button" @click="resetAll">重置</button>
            <button class="btn primary" type="button" @click="saveAllSettings">保存</button>
          </div>
        </div>

        <div class="section">
          <div class="section-title">显示设置</div>
          <div class="row" style="margin-top: 12px; align-items: flex-start">
            <div class="row-left">
              <div class="row-label">界面缩放</div>
              <div class="row-hint">调整UI界面大小（50%-200%）</div>
            </div>
            <div class="range-box">
              <input class="range" type="range" min="50" max="200" step="1" v-model.number="uiScale" />
              <span class="range-val">{{ uiScale }}%</span>
            </div>
          </div>

          <div class="row" style="margin-top: 12px; align-items: flex-start">
            <div class="row-left">
              <div class="row-label">文字大小</div>
              <div class="row-hint">调整游戏文字显示大小</div>
            </div>
            <div class="range-box">
              <input class="range" type="range" min="10" max="30" step="1" v-model.number="fontSize" />
              <span class="range-val">{{ fontSize }}px</span>
            </div>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">快速动画</div>
              <div class="row-hint">加速界面动画和过渡效果</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="fastAnimations" />
              <span class="slider" />
            </label>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">显示提示</div>
              <div class="row-hint">显示操作提示和帮助信息</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="showHints" />
              <span class="slider" />
            </label>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">行动选项</div>
              <div class="row-hint">AI生成可选的行动建议</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="enableActionOptions" />
              <span class="slider" />
            </label>
          </div>
        </div>

        <div class="section">
          <div class="section-title">自动存档设置</div>

          <div class="row">
            <div class="row-left">
              <div class="row-label">对话前自动备份</div>
              <div class="row-hint">每次对话前自动备份，用于回退到上次对话前的状态</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="enablePreDialogBackup" />
              <span class="slider" />
            </label>
          </div>

          <div class="row">
            <div class="row-left">
              <div class="row-label">定时自动保存</div>
              <div class="row-hint">开启后将按固定间隔触发保存（游玩界面生效）</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="enableAutoSave" />
              <span class="slider" />
            </label>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">自动保存间隔（分钟）</div>
              <div class="row-hint">建议 5 分钟；范围 1-120</div>
            </div>
            <input class="input" type="number" min="1" max="120" v-model.number="autoSaveIntervalMinutes" />
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">存储空间诊断</div>
              <div class="row-hint">查看浏览器存储使用情况（IndexedDB/缓存等）</div>
            </div>
            <button class="btn btn-ghost" type="button" @click="diagnoseStorage">诊断</button>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">设置导出 / 导入</div>
              <div class="row-hint">用于跨设备迁移设置（不包含存档）</div>
            </div>
            <div class="row-actions">
              <button class="btn btn-ghost" type="button" @click="exportSettings">导出</button>
              <button class="btn btn-ghost" type="button" @click="importSettings">导入</button>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">AI服务配置</div>

          <div class="row" style="align-items: flex-start">
            <div class="row-left">
              <div class="row-label">AI 提供商</div>
              <div class="row-hint">官方端点 / DeepSeek / 自定义</div>
            </div>
            <select class="input" v-model="aiProviderPreset">
              <option value="custom">自定义</option>
              <option value="official">官方端点</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">流式传输</div>
              <div class="row-hint">实时显示AI生成内容</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="aiStreaming" />
              <span class="slider" />
            </label>
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">记忆总结模式</div>
              <div class="row-hint">Raw模式更准确，标准模式包含预设</div>
            </div>
            <select class="input" v-model="memorySummaryMode">
              <option value="raw">Raw模式（推荐）</option>
              <option value="standard">标准模式</option>
            </select>
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">开局生成模式</div>
              <div class="row-hint">角色初始化使用的生成模式</div>
            </div>
            <select class="input" v-model="initMode">
              <option value="standard">标准模式</option>
              <option value="generate">Raw模式</option>
            </select>
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">API Base URL</div>
              <div class="row-hint">选择内置提供商时自动使用对应端点；自定义时可手填</div>
            </div>
            <input
              v-if="aiProviderPreset === 'custom'"
              class="input"
              type="text"
              v-model.trim="customApiUrl"
              placeholder="https://api.openai.com"
            />
            <input v-else class="input" type="text" :value="resolvedAiBaseUrlDisplay" disabled />
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">API Key</div>
              <div class="row-hint">如后端要求鉴权，请填写</div>
            </div>
            <input class="input" type="password" v-model.trim="customApiKey" placeholder="" />
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">模型</div>
              <div class="row-hint">可手动填写或点击刷新获取</div>
            </div>
            <div class="row-actions">
              <select v-if="aiModelList.length" class="input" v-model="aiModel">
                <option v-for="m in aiModelList" :key="m" :value="m">{{ m }}</option>
              </select>
              <input v-else class="input" type="text" v-model.trim="aiModel" placeholder="例如：deepseek-chat" />
              <button class="btn btn-ghost" type="button" @click="refreshModels">刷新模型</button>
            </div>
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">温度</div>
              <div class="row-hint">范围 0-2</div>
            </div>
            <input class="input" type="number" min="0" max="2" step="0.1" v-model.number="aiTemperature" />
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">最大上下文 Token</div>
              <div class="row-hint">用于控制上下文裁剪策略（后续接入）</div>
            </div>
            <input class="input" type="number" min="256" max="400000" v-model.number="aiMaxContextTokens" />
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">最大输出 Token</div>
              <div class="row-hint">max_tokens</div>
            </div>
            <input class="input" type="number" min="16" max="200000" v-model.number="aiMaxOutputTokens" />
          </div>

          <div class="row" style="align-items: flex-start; margin-top: 12px">
            <div class="row-left">
              <div class="row-label">云端同步 URL（预留）</div>
              <div class="row-hint">联机/云端存档后续接入</div>
            </div>
            <input class="input" type="text" v-model.trim="cloudSyncUrl" placeholder="http://localhost:9000" />
          </div>
        </div>

        <div class="section">
          <div class="section-title">高级设置</div>

          <div class="row">
            <div class="row-left">
              <div class="row-label">调试模式</div>
              <div class="row-hint">启用开发者调试信息和详细日志</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="debugMode" />
              <span class="slider" />
            </label>
          </div>

          <div class="row">
            <div class="row-left">
              <div class="row-label">使用导入提示词覆盖</div>
              <div class="row-hint">开启后会额外注入导入的酒馆提示词（不会替代内置核心规则；提示词管理修改会生效）</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="useImportedPromptOverrides" />
              <span class="slider" />
            </label>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">导入提示词（JSON）</div>
              <div class="row-hint">仅导入，不在界面展示提示词内容</div>
            </div>
            <button class="btn btn-ghost" type="button" @click="importPrompts">导入</button>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">提示词管理</div>
              <div class="row-hint">自定义AI提示词和规则</div>
            </div>
            <button class="btn btn-ghost" type="button" @click="openPromptManagement">管理</button>
          </div>

          <div class="row" style="margin-top: 12px">
            <div class="row-left">
              <div class="row-label">清理缓存</div>
              <div class="row-hint">清理临时数据（不影响存档）</div>
            </div>
            <button class="btn btn-ghost" type="button" @click="clearCache">清理</button>
          </div>
        </div>

        <div class="section">
          <div class="section-title">授权</div>
          <div class="row">
            <div class="row-left">
              <div class="row-label">清除授权验证</div>
              <div class="row-hint">清除后需要重新验证</div>
            </div>
            <button class="btn btn-danger" type="button" @click="clearAuth">清除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '../stores/useAuthStore'
import { useSettingsStore, type AiProviderPreset } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import { listModels } from '../services/aiClient'
import { resolveAiBaseUrl } from '../services/aiProviders'
import { promptStore } from '../services/promptStore'
import { downloadTextFile } from '../utils/download'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const router = useRouter()
const uiStore = useUIStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  settingsStore.load()
})

const enableAutoSave = computed({
  get: () => settingsStore.enableAutoSave,
  set: (v: boolean) => settingsStore.update('enableAutoSave', v)
})

const enablePreDialogBackup = computed({
  get: () => settingsStore.enablePreDialogBackup,
  set: (v: boolean) => settingsStore.update('enablePreDialogBackup', v)
})

const autoSaveIntervalMinutes = computed({
  get: () => settingsStore.autoSaveIntervalMinutes,
  set: (v: number) => settingsStore.update('autoSaveIntervalMinutes', Number(v))
})

const uiScale = computed({
  get: () => settingsStore.uiScale,
  set: (v: number) => settingsStore.update('uiScale', Number(v))
})

const fontSize = computed({
  get: () => settingsStore.fontSize,
  set: (v: number) => settingsStore.update('fontSize', Number(v))
})

const fastAnimations = computed({
  get: () => settingsStore.fastAnimations,
  set: (v: boolean) => settingsStore.update('fastAnimations', v)
})

const showHints = computed({
  get: () => settingsStore.showHints,
  set: (v: boolean) => settingsStore.update('showHints', v)
})

const debugMode = computed({
  get: () => settingsStore.debugMode,
  set: (v: boolean) => settingsStore.update('debugMode', v)
})

const enableActionOptions = computed({
  get: () => settingsStore.enableActionOptions,
  set: (v: boolean) => settingsStore.update('enableActionOptions', v)
})

const customApiUrl = computed({
  get: () => settingsStore.customApiUrl,
  set: (v: string) => settingsStore.update('customApiUrl', v)
})

const customApiKey = computed({
  get: () => settingsStore.customApiKey,
  set: (v: string) => settingsStore.update('customApiKey', v)
})

const aiProviderPreset = computed({
  get: () => settingsStore.aiProviderPreset,
  set: (v: AiProviderPreset) => settingsStore.update('aiProviderPreset', v)
})

const resolvedAiBaseUrl = computed(() => resolveAiBaseUrl({ preset: aiProviderPreset.value, customBaseUrl: customApiUrl.value }))

const resolvedAiBaseUrlDisplay = computed(() => {
  if (aiProviderPreset.value === 'official') return '官方端点'
  return resolvedAiBaseUrl.value
})

const aiModel = computed({
  get: () => settingsStore.aiModel,
  set: (v: string) => settingsStore.update('aiModel', v)
})

const aiModelList = computed(() => settingsStore.aiModelList)

const aiTemperature = computed({
  get: () => settingsStore.aiTemperature,
  set: (v: number) => settingsStore.update('aiTemperature', Number(v))
})

const aiMaxContextTokens = computed({
  get: () => settingsStore.aiMaxContextTokens,
  set: (v: number) => settingsStore.update('aiMaxContextTokens', Number(v))
})

const aiMaxOutputTokens = computed({
  get: () => settingsStore.aiMaxOutputTokens,
  set: (v: number) => settingsStore.update('aiMaxOutputTokens', Number(v))
})

const aiStreaming = computed({
  get: () => settingsStore.aiStreaming,
  set: (v: boolean) => settingsStore.update('aiStreaming', v)
})

const memorySummaryMode = computed({
  get: () => settingsStore.memorySummaryMode,
  set: (v: any) => settingsStore.update('memorySummaryMode', v)
})

const initMode = computed({
  get: () => settingsStore.initMode,
  set: (v: any) => settingsStore.update('initMode', v)
})

const cloudSyncUrl = computed({
  get: () => settingsStore.cloudSyncUrl,
  set: (v: string) => settingsStore.update('cloudSyncUrl', v)
})

async function refreshModels() {
  try {
    const baseUrl = resolveAiBaseUrl({ preset: aiProviderPreset.value, customBaseUrl: customApiUrl.value })
    const models = await listModels({ baseUrl, apiKey: (customApiKey.value || '').trim(), timeoutMs: 20000 })
    settingsStore.update('aiModelList', models)
    try {
      localStorage.setItem('ai_available_models', JSON.stringify(models))
    } catch {
      void 0
    }
    if (!aiModel.value && models.length) settingsStore.update('aiModel', models[0])
    if (!models.length) alert('未获取到模型列表（可手动填写模型名）')
  } catch (e) {
    alert(e instanceof Error ? `刷新模型失败：${e.message}` : '刷新模型失败')
  }
}

function openPromptManagement() {
  close()
  router.push({ name: 'PromptManagement' })
}

function resetAll() {
  if (!confirm('确定要重置所有设置到默认值吗？')) return
  settingsStore.resetToDefaults()
  alert('已重置为默认设置')
}

function saveAllSettings() {
  settingsStore.save()
  try {
    const baseUrl = resolveAiBaseUrl({ preset: aiProviderPreset.value, customBaseUrl: customApiUrl.value })
    const aiConfig = {
      mode: 'custom',
      streaming: aiStreaming.value,
      memorySummaryMode: memorySummaryMode.value,
      initMode: initMode.value,
      customAPI: {
        url: String(baseUrl || '').replace(/\/v1\/?$/, '').replace(/\/+$/, ''),
        apiKey: String((customApiKey.value || '').trim()),
        model: String((aiModel.value || '').trim() || 'gpt-3.5-turbo'),
        temperature: Number(aiTemperature.value || 0.7),
        maxTokens: Number(aiMaxOutputTokens.value || 2048)
      }
    }
    localStorage.setItem('ai_service_config', JSON.stringify(aiConfig))
  } catch {
    void 0
  }
  alert('已保存')
}

const useImportedPromptOverrides = computed({
  get: () => settingsStore.useImportedPromptOverrides,
  set: (v: boolean) => settingsStore.update('useImportedPromptOverrides', v)
})

async function importPrompts() {
  try {
    const text = prompt('请粘贴提示词JSON内容：')
    if (!text) return
    const parsed = JSON.parse(text) as Record<string, any>
    const count = await promptStore.importPrompts(parsed)
    alert(`提示词导入成功：${count} 条`)
  } catch (e) {
    alert(e instanceof Error ? `导入提示词失败：${e.message}` : '导入提示词失败，请检查文件格式')
  }
}

function close() {
  emit('update:modelValue', false)
}

function clearAuth() {
  if (confirm('确定要清除当前的授权验证信息吗？清除后需要重新验证。')) {
    authStore.clearAuth()
  }
}

async function diagnoseStorage() {
  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage ?? 0
    const quota = estimate.quota ?? 0
    const ratio = quota ? (usage / quota) * 100 : 0
    alert(`存储使用情况\n\n已使用: ${formatBytes(usage)}\n总容量: ${formatBytes(quota)}\n使用率: ${ratio.toFixed(2)}%`)
  } catch (e) {
    alert(e instanceof Error ? `存储空间检查失败：${e.message}` : '存储空间检查失败')
  }
}

function exportSettings() {
  const content = settingsStore.exportSettings()
  const filename = `dad_game_settings_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  downloadTextFile(filename, content)
}

function importSettings() {
  try {
    const text = prompt('请粘贴设置JSON内容：')
    if (!text) return
    settingsStore.importSettings(text)
    alert('设置导入成功并应用')
  } catch (e) {
    alert(e instanceof Error ? `导入设置失败：${e.message}` : '导入设置失败，请检查文件格式')
  }
}

function clearCache() {
  if (!confirm('确定要清理缓存吗？这将删除临时数据但不会影响存档。')) return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith('dad_cache_') || k.startsWith('temp_') || k.startsWith('debug_') || k.includes('_temp')) {
        keys.push(k)
      }
    }
    for (const k of keys) localStorage.removeItem(k)
    sessionStorage.clear()
    alert(`已清理 ${keys.length} 项缓存数据`)
  } catch {
    alert('清理缓存失败')
  }
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let val = bytes
  let idx = 0
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024
    idx += 1
  }
  return `${val.toFixed(2)} ${units[idx]}`
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.62);
  display: grid;
  place-items: center;
  padding: 0;
  z-index: 40;
}

.settings-modal {
  width: min(1100px, 100%);
  height: min(900px, 100vh);
  border-radius: 0;
  border: 0;
  background: transparent;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}

.nav {
  height: 48px;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--panel-border);
}

.nav-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  color: var(--text-1);
}

.nav-ico {
  font-size: 14px;
}

.nav-btn {
  width: 48px;
  height: 48px;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--text-1);
  font-size: 18px;
}

.nav-right {
  width: 48px;
  height: 48px;
}

.settings-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
  min-height: 0;
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
}

.hero {
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-ico {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-1);
  display: grid;
  place-items: center;
  font-weight: 800;
}

.hero-title {
  font-weight: 800;
  color: var(--text-1);
}

.hero-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted);
}

.hero-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.section {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 10px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row-left {
  display: grid;
  gap: 3px;
}

.row-label {
  font-size: 14px;
  color: var(--text-1);
}

.row-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.btn {
  appearance: none;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
}

.btn-ghost {
  background: rgba(0, 0, 0, 0.02);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.04);
}

.btn.primary {
  background: rgba(37, 99, 235, 0.95);
  border-color: rgba(37, 99, 235, 0.95);
  color: rgba(255, 255, 255, 0.98);
}

.btn-danger {
  background: rgba(255, 241, 242, 0.95);
  border-color: rgba(253, 164, 175, 0.9);
  color: rgba(225, 29, 72, 0.95);
}

.btn-danger:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.2);
}

.row-actions {
  display: flex;
  gap: 10px;
}

.input {
  width: min(260px, 100%);
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  outline: none;
}

.input:focus {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.14);
}

.range-box {
  width: min(260px, 100%);
  display: flex;
  align-items: center;
  gap: 10px;
}

.range {
  width: 100%;
}

.range-val {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 52px;
  text-align: right;
}

.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.switch input {
  display: none;
}

.slider {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: rgba(203, 213, 225, 0.55);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
}

.slider::after {
  content: '';
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
}

.switch input:checked + .slider {
  background: rgba(37, 99, 235, 0.95);
  border-color: rgba(37, 99, 235, 0.95);
}

.switch input:checked + .slider::after {
  transform: translateX(18px);
}
</style>
