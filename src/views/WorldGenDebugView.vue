<template>
  <div class="wrap">
    <div class="topbar">
      <div class="title">世界生成调试</div>
      <div class="actions">
        <button class="btn" type="button" @click="goBack">← 返回</button>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">输入参数</div>

        <div class="form">
          <label class="field">
            <span class="label">世界名称</span>
            <input class="input" v-model.trim="draft.worldName" placeholder="例如：朝天界" />
          </label>

          <label class="field">
            <span class="label">世界纪元</span>
            <input class="input" v-model.trim="draft.worldEra" placeholder="例如：第七纪元" />
          </label>

          <label class="field">
            <span class="label">世界背景</span>
            <textarea class="textarea" v-model.trim="draft.worldBackground" placeholder="一句话概括世界背景" />
          </label>

          <label class="field">
            <span class="label">角色名称</span>
            <input class="input" v-model.trim="draft.characterName" placeholder="用于 seedBase" />
          </label>

          <label class="field">
            <span class="label">角色出身</span>
            <input class="input" v-model.trim="draft.characterBackground" placeholder="用于提示词输入" />
          </label>

          <div class="row">
            <label class="field inline">
              <span class="label">大陆数</span>
              <input class="input" type="number" min="1" max="10" step="1" v-model.number="draft.continentCount" />
            </label>
            <label class="field inline">
              <span class="label">势力数</span>
              <input class="input" type="number" min="1" max="30" step="1" v-model.number="draft.factionCount" />
            </label>
            <label class="field inline">
              <span class="label">地点数</span>
              <input class="input" type="number" min="1" max="60" step="1" v-model.number="draft.locationCount" />
            </label>
          </div>

          <div class="row">
            <label class="field inline">
              <span class="label">Seed</span>
              <input class="input" type="number" v-model.number="draft.seed" />
            </label>

            <label class="check">
              <input type="checkbox" v-model="writeToSave" />
              <span>写入到当前运行中的游戏状态（世界信息/初始位置）</span>
            </label>
          </div>

          <div class="hint">
            <div class="muted">AI 调用将使用“设置”里配置的 provider/model/baseUrl；没有配置则会提示你。</div>
            <div class="muted">每次点击都会清空日志与输出，方便连续复现。</div>
          </div>

          <div class="buttons">
            <button class="btn primary" type="button" :disabled="running" @click="run('ai')">用AI生成</button>
            <button class="btn" type="button" :disabled="running" @click="run('local')">本地生成</button>
            <button class="btn danger" type="button" :disabled="running" @click="clearAll">清空</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">日志 / 报错</div>

        <div class="status">
          <span class="tag" :class="running ? 'tag-warn' : 'tag-ok'">{{ running ? '运行中' : '空闲' }}</span>
          <span class="muted">{{ lastStatus }}</span>
        </div>

        <pre class="pre log">{{ logText }}</pre>

        <div v-if="errorText" class="err-box">
          <div class="err-title">错误信息（原样展示）</div>
          <pre class="pre err">{{ errorText }}</pre>
        </div>
      </div>

      <div class="card full">
        <div class="card-title">生成结果（WorldInfo）</div>
        <div class="actions-row">
          <button class="btn" type="button" :disabled="!result" @click="copyResult">复制JSON</button>
        </div>
        <pre class="pre out">{{ resultText }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStateStore } from '../stores/useGameStateStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { resolveAiBaseUrl } from '../services/aiProviders'
import { generateWorldInfo, pickInitialLocation } from '../services/worldGeneration'

const router = useRouter()
const gameState = useGameStateStore()
const settingsStore = useSettingsStore()

const running = ref(false)
const lastStatus = ref('')
const errorText = ref('')
const logLines = ref<string[]>([])
const result = ref<any>(null)

const writeToSave = ref(false)

const draft = reactive({
  worldName: '修仙界',
  worldEra: '修仙纪元',
  worldBackground: '一个灵气充沛、宗门林立、机缘与危机并存的修仙世界。',
  characterName: '无名',
  characterBackground: '凡俗出身',
  continentCount: 3,
  factionCount: 5,
  locationCount: 10,
  seed: Date.now()
})

const logText = computed(() => logLines.value.join('\n'))
const resultText = computed(() => (result.value ? JSON.stringify(result.value, null, 2) : ''))

function goBack() {
  router.back()
}

function clearAll() {
  lastStatus.value = ''
  errorText.value = ''
  logLines.value = []
  result.value = null
}

function pushLog(line: string) {
  const ts = new Date().toLocaleTimeString()
  logLines.value = [...logLines.value, `[${ts}] ${line}`]
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(resultText.value)
    pushLog('已复制结果 JSON 到剪贴板')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    pushLog(`复制失败：${msg}`)
  }
}

async function run(mode: 'ai' | 'local') {
  if (running.value) return
  clearAll()
  running.value = true
  try {
    const input = {
      worldName: draft.worldName,
      worldEra: draft.worldEra,
      worldBackground: draft.worldBackground,
      characterName: draft.characterName,
      characterBackground: draft.characterBackground,
      seed: Number(draft.seed) || Date.now(),
      counts: {
        continentCount: Number(draft.continentCount) || 3,
        factionCount: Number(draft.factionCount) || 5,
        locationCount: Number(draft.locationCount) || 10,
        secretRealmsCount: Math.min(Number(draft.locationCount) || 10, 5)
      }
    }

    const onProgress = (t: string) => {
      lastStatus.value = t
      pushLog(t)
    }

    let out: any

    if (mode === 'local') {
      pushLog('开始：本地生成')
      out = await generateWorldInfo(input, { provider: 'local', onProgress })
    } else {
      const aiBaseUrl = resolveAiBaseUrl({ preset: settingsStore.aiProviderPreset, customBaseUrl: settingsStore.customApiUrl })
      const aiModel = (settingsStore.aiModel || '').trim()
      const apiKey = (settingsStore.customApiKey || '').trim()

      if (!aiBaseUrl || !aiModel) {
        throw new Error('未配置AI服务：请到 设置 中配置 provider/baseUrl + model 后再测试')
      }

      pushLog(`开始：AI生成（baseUrl=${aiBaseUrl} / model=${aiModel}）`)

      out = await generateWorldInfo(input, {
        provider: 'openai_compat',
        openAiCompat: {
          baseUrl: aiBaseUrl,
          apiKey,
          model: aiModel,
          temperature: settingsStore.aiTemperature,
          maxTokens: settingsStore.aiMaxOutputTokens,
          timeoutMs: 240000
        },
        onProgress
      })
    }

    result.value = out
    pushLog('生成成功：WorldInfo 已返回')

    if (writeToSave.value) {
      ;(gameState as any).世界信息 = out
      try {
        gameState.玩家角色状态.位置 = pickInitialLocation(out)
        pushLog('已写入：世界信息 + 初始位置')
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        pushLog(`写入初始位置失败：${msg}`)
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errorText.value = msg
    pushLog(`失败：${msg}`)
  } finally {
    running.value = false
  }
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

.form {
  display: grid;
  gap: 10px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
}

.inline {
  min-width: 0;
}

.label {
  color: rgba(148, 163, 184, 0.92);
  font-size: 12px;
}

.input,
.textarea {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.4);
  color: rgba(226, 232, 240, 0.92);
  padding: 10px 10px;
  outline: none;
}

.textarea {
  min-height: 88px;
  resize: vertical;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 2 / -1;
  color: rgba(226, 232, 240, 0.86);
}

.hint {
  display: grid;
  gap: 4px;
}

.muted {
  color: rgba(148, 163, 184, 0.9);
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

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
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

.tag-ok {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
}

.tag-warn {
  border-color: rgba(234, 179, 8, 0.35);
  background: rgba(234, 179, 8, 0.12);
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

.log {
  min-height: 220px;
}

.err-box {
  margin-top: 10px;
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.28);
  background: rgba(248, 113, 113, 0.08);
  padding: 10px;
}

.err-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.err {
  max-height: 220px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .check {
    grid-column: auto;
  }
}
</style>
