<template>
  <div class="root">
    <div class="body">
      <div class="tabs-wrap">
        <div class="tabs">
          <button v-for="t in tabs" :key="t.key" class="tab" type="button" :class="{ active: currentFilter === t.key }" @click="setFilter(t.key)">
            <span class="tab-icon">{{ t.icon }}</span>
            <span>{{ t.label }}</span>
            <span class="tab-count" :class="{ active: currentFilter === t.key }">{{ t.count }}</span>
          </button>
        </div>
        <div class="row" style="gap: 10px">
          <button class="icon-btn" type="button" style="display: none" :disabled="refreshing" title="刷新" @click="refreshFromSave">⟳</button>
          <button class="icon-btn" type="button" style="display: none" title="筛选" @click="showSearch = !showSearch">⌕</button>
          <button class="icon-btn" type="button" style="display: none" title="清空" @click="clearByFilter">🗑</button>
          <button class="icon-btn" type="button" title="设置" @click="showSettings = !showSettings">⚙</button>
        </div>
      </div>

      <div v-if="showSearch" class="card" style="margin-top: 12px">
        <div class="card-title">搜索</div>
        <input class="input" type="text" v-model.trim="searchQuery" placeholder="搜索记忆内容..." />
      </div>

      <div class="card card-export" style="margin-top: 12px">
        <div class="row">
          <button class="btn" type="button" @click="exportNovel">导出为小说</button>
          <div class="muted" style="flex: 1">将完整的游戏对话历史（基于叙事历史）导出为小说格式，方便阅读和分享。</div>
        </div>
      </div>

      <div v-if="showSettings" class="card" style="margin-top: 12px">
        <div class="card-title">记忆系统设置</div>

        <div class="kv">
          <span class="k">短期记忆上限（条）</span>
          <span class="v"><input class="input" type="number" v-model.number="settingsDraft.maxShortTerm" min="1" max="20" /></span>
        </div>

        <div class="kv">
          <span class="k">中期记忆转化阈值（条）</span>
          <span class="v"><input class="input" type="number" v-model.number="settingsDraft.midTermTrigger" min="1" max="200" /></span>
        </div>

        <div class="kv">
          <span class="k">中期记忆保留数量（条）</span>
          <span class="v"><input class="input" type="number" v-model.number="settingsDraft.midTermKeep" min="0" max="200" /></span>
        </div>

        <div class="kv">
          <span class="k">启用自动记忆转化</span>
          <span class="v"><input type="checkbox" v-model="settingsDraft.autoSummaryEnabled" /></span>
        </div>

        <div class="kv">
          <span class="k">使用原始模式</span>
          <span class="v"><input type="checkbox" v-model="settingsDraft.useRawMode" /></span>
        </div>

        <div class="kv">
          <span class="k">使用流式处理</span>
          <span class="v"><input type="checkbox" v-model="settingsDraft.useStreaming" /></span>
        </div>

        <div class="kv" style="align-items: flex-start">
          <span class="k">自定义中期记忆格式</span>
          <span class="v" style="flex: 1"><textarea class="textarea" v-model="settingsDraft.midTermFormat" placeholder="留空使用默认格式" /></span>
        </div>

        <div class="kv" style="align-items: flex-start">
          <span class="k">自定义长期记忆格式</span>
          <span class="v" style="flex: 1"><textarea class="textarea" v-model="settingsDraft.longTermFormat" placeholder="留空使用默认格式" /></span>
        </div>

        <div class="actions" style="justify-content: flex-start">
          <button class="btn" type="button" @click="saveSettings">保存配置</button>
          <button class="btn btn-ghost" type="button" @click="resetSettings">重置为默认</button>
        </div>

        <div class="muted" style="margin-top: 8px">当前中期记忆：{{ midItems.length }} 条</div>
      </div>

      <div class="card" style="margin-top: 12px; display: none">
        <div class="row" style="justify-content: space-between">
          <div class="row" style="gap: 10px">
            <button class="btn btn-ghost" type="button" @click="copyCurrent">复制当前列表</button>
            <button class="btn btn-ghost" type="button" @click="downloadMemoryJson">导出记忆JSON</button>
          </div>
          <div class="row" style="gap: 10px">
            <button class="btn" type="button" :disabled="!canSummarize" @click="triggerAiSummary">AI总结</button>
            <button class="btn btn-ghost" type="button" :disabled="saving" @click="saveToArchive">{{ saving ? '保存中...' : '保存到存档' }}</button>
          </div>
        </div>
        <div v-if="hintText" class="muted" style="margin-top: 8px">{{ hintText }}</div>
      </div>

      <div v-if="paginatedItems.length === 0" class="empty">
        <div class="empty-icon">🧠</div>
        <div class="muted" style="font-size: 16px">心如明镜，尚未记录任何修行感悟</div>
      </div>

      <div v-else class="list" style="margin-top: 12px">
        <div v-for="(m, idx) in paginatedItems" :key="m.key" class="mem-item">
          <div class="mem-left">
            <div class="mem-meta">
              <span class="mem-type" :class="m.type">{{ typeLabel(m.type) }}</span>
              <span class="mem-time">{{ m.time }}</span>
            </div>
            <div class="mem-content">{{ m.content }}</div>
          </div>
          <div class="mem-right" style="display: none">
            <button class="btn btn-ghost" type="button" @click="copyText(m.content)">复制</button>
            <button class="btn btn-ghost" type="button" @click="removeOne(m)">删除</button>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pager">
        <button class="btn btn-ghost" type="button" :disabled="currentPage <= 1" @click="currentPage = 1">首页</button>
        <button class="btn btn-ghost" type="button" :disabled="currentPage <= 1" @click="currentPage -= 1">上一页</button>
        <div class="muted">{{ currentPage }} / {{ totalPages }}</div>
        <button class="btn btn-ghost" type="button" :disabled="currentPage >= totalPages" @click="currentPage += 1">下一页</button>
        <button class="btn btn-ghost" type="button" :disabled="currentPage >= totalPages" @click="currentPage = totalPages">末页</button>
      </div>

      <div v-if="noticeText" class="muted" style="margin-top: 8px">{{ noticeText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import type { TavernCommand } from '../services/tavernCommands'
import { runMemorySummary } from '../services/memorySummary'
import { resolveAiBaseUrl } from '../services/aiProviders'

const emit = defineEmits<{
  (e: 'fill-action', text: string): void
}>()

type FilterKey = 'all' | 'short' | 'medium' | 'long'

type MemoryItem = {
  key: string
  type: 'short' | 'medium' | 'long'
  content: string
  time: string
  importance: number
}

type MemorySettings = {
  maxShortTerm: number
  midTermTrigger: number
  midTermKeep: number
  autoSummaryEnabled: boolean
  midTermFormat: string
  longTermFormat: string
  useRawMode: boolean
  useStreaming: boolean
}

const DEFAULT_SETTINGS: MemorySettings = {
  maxShortTerm: 3,
  midTermTrigger: 25,
  midTermKeep: 8,
  autoSummaryEnabled: true,
  midTermFormat: '',
  longTermFormat: '',
  useRawMode: true,
  useStreaming: true
}

const gameState = useGameStateStore()
const characterStore = useCharacterStore()
const settingsStore = useSettingsStore()

const currentFilter = ref<FilterKey>('all')
const showSettings = ref(false)
const showSearch = ref(false)
const searchQuery = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

const saving = ref(false)
const summarizing = ref(false)
const refreshing = ref(false)
const noticeText = ref('')

const settingsDraft = reactive<MemorySettings>({ ...DEFAULT_SETTINGS })

watch(
  () => settingsStore.memorySummaryMode,
  (v) => {
    settingsDraft.useRawMode = v === 'raw'
  },
  { immediate: true }
)

watch(
  () => settingsStore.aiStreaming,
  (v) => {
    settingsDraft.useStreaming = !!v
  },
  { immediate: true }
)

function typeIcon(t: MemoryItem['type']) {
  if (t === 'short') return '⚡'
  if (t === 'medium') return '💭'
  return '💾'
}

function typeLabel(t: MemoryItem['type']) {
  if (t === 'short') return '短期记忆'
  if (t === 'medium') return '中期记忆'
  return '长期记忆'
}

function nowTimeLabel() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}`
}

function extractTimeFromContent(text: string) {
  const s = String(text || '')
  if (s.startsWith('【') && s.includes('】')) {
    const idx = s.indexOf('】')
    if (idx > 0) return s.slice(1, idx)
  }
  return ''
}

const memoryState = computed<any>(() => (gameState as any).记忆 || (gameState as any).memory || null)

const shortItems = ref<MemoryItem[]>([])
const midItems = ref<MemoryItem[]>([])
const longItems = ref<MemoryItem[]>([])

function buildItems(type: MemoryItem['type'], arr: any[], importance: number) {
  const out: MemoryItem[] = []
  const baseNow = Date.now()
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i]
    if (!c || typeof c !== 'string') continue
    const time = extractTimeFromContent(c) || nowTimeLabelFromEpoch(baseNow - 300000 * i)
    out.push({ key: `${type}-${i}-${c.slice(0, 12)}`, type, content: c, time, importance })
  }
  return out
}

function nowTimeLabelFromEpoch(t: number) {
  const d = new Date(t)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}`
}

function ensureMemoryExists(): TavernCommand[] {
  const m = (gameState as any).记忆
  if (m && typeof m === 'object') return []
  return [
    {
      action: 'set',
      key: '记忆',
      value: {
        短期记忆: [],
        中期记忆: [],
        长期记忆: [],
        隐式中期记忆: []
      }
    } as TavernCommand
  ]
}

function loadFromState() {
  const m = memoryState.value
  const shortArr = Array.isArray(m?.短期记忆) ? m.短期记忆 : []
  const midArr = Array.isArray(m?.中期记忆) ? m.中期记忆 : []
  const longArr = Array.isArray(m?.长期记忆) ? m.长期记忆 : []

  shortItems.value = buildItems('short', shortArr, 5)
  midItems.value = buildItems('medium', midArr, 7)
  longItems.value = buildItems('long', longArr, 9)

  noticeText.value = ''
  currentPage.value = 1
}

function setFilter(k: FilterKey) {
  currentFilter.value = k
  currentPage.value = 1
}

const tabs = computed(() => {
  const all = shortItems.value.length + midItems.value.length + longItems.value.length
  return [
    { key: 'all' as const, label: '全部', icon: '🧠', count: all },
    { key: 'short' as const, label: '短期', icon: '⚡', count: shortItems.value.length },
    { key: 'medium' as const, label: '中期', icon: '💭', count: midItems.value.length },
    { key: 'long' as const, label: '长期', icon: '💾', count: longItems.value.length }
  ]
})

const filteredItems = computed(() => {
  let arr: MemoryItem[]
  if (currentFilter.value === 'short') arr = shortItems.value
  else if (currentFilter.value === 'medium') arr = midItems.value
  else if (currentFilter.value === 'long') arr = longItems.value
  else arr = [...shortItems.value, ...midItems.value, ...longItems.value]

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return arr
  return arr.filter(x => x.content.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

watch(
  totalPages,
  v => {
    if (currentPage.value > v) currentPage.value = v
  },
  { immediate: true }
)

function applyToState() {
  const cmds: TavernCommand[] = [...ensureMemoryExists()]
  cmds.push({ action: 'set', key: '记忆.短期记忆', value: shortItems.value.map(x => x.content) })
  cmds.push({ action: 'set', key: '记忆.中期记忆', value: midItems.value.map(x => x.content) })
  cmds.push({ action: 'set', key: '记忆.长期记忆', value: longItems.value.map(x => x.content) })

  const implicit = memoryState.value?.隐式中期记忆
  if (!Array.isArray(implicit)) {
    cmds.push({ action: 'set', key: '记忆.隐式中期记忆', value: [] })
  }

  gameState.applyCommands(cmds)
}

async function saveToArchive() {
  try {
    saving.value = true
    applyToState()
    await characterStore.saveCurrentGame()
    noticeText.value = '记忆数据已保存到存档'
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    noticeText.value = `保存失败：${msg}`
  } finally {
    saving.value = false
  }
}

function getSettingsFromLocalStorage(): MemorySettings {
  try {
    const raw = localStorage.getItem('memory-settings')
    if (!raw) return { ...DEFAULT_SETTINGS }
    const obj = JSON.parse(raw) as Partial<MemorySettings>
    return {
      ...DEFAULT_SETTINGS,
      ...obj
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function loadSettings() {
  const s = getSettingsFromLocalStorage()
  Object.assign(settingsDraft, s)
  settingsDraft.useRawMode = settingsStore.memorySummaryMode === 'raw'
  settingsDraft.useStreaming = settingsStore.aiStreaming
}

function saveSettings() {
  const out: MemorySettings = {
    maxShortTerm: Math.max(1, Math.floor(Number(settingsDraft.maxShortTerm) || DEFAULT_SETTINGS.maxShortTerm)),
    midTermTrigger: Math.max(1, Math.floor(Number(settingsDraft.midTermTrigger) || DEFAULT_SETTINGS.midTermTrigger)),
    midTermKeep: Math.max(0, Math.floor(Number(settingsDraft.midTermKeep) || DEFAULT_SETTINGS.midTermKeep)),
    autoSummaryEnabled: !!settingsDraft.autoSummaryEnabled,
    midTermFormat: String(settingsDraft.midTermFormat || ''),
    longTermFormat: String(settingsDraft.longTermFormat || ''),
    useRawMode: !!settingsDraft.useRawMode,
    useStreaming: !!settingsDraft.useStreaming
  }

  localStorage.setItem('memory-settings', JSON.stringify(out))
  settingsStore.update('memorySummaryMode', out.useRawMode ? 'raw' : 'standard')
  settingsStore.update('aiStreaming', out.useStreaming)
  noticeText.value = '记忆系统配置已保存'
}

function resetSettings() {
  Object.assign(settingsDraft, { ...DEFAULT_SETTINGS })
  localStorage.setItem('memory-settings', JSON.stringify({ ...DEFAULT_SETTINGS }))
  noticeText.value = '已重置为默认配置'
}

const canSummarize = computed(() => {
  const trigger = Number(settingsDraft.midTermTrigger) || DEFAULT_SETTINGS.midTermTrigger
  return midItems.value.length >= trigger
})

const hintText = computed(() => {
  const trigger = Number(settingsDraft.midTermTrigger) || DEFAULT_SETTINGS.midTermTrigger
  if (midItems.value.length === 0) return ''
  if (midItems.value.length < trigger) return `中期记忆数量(${midItems.value.length})未达到转化阈值(${trigger})`
  return `中期记忆已达到转化阈值(${trigger})，建议点击“AI总结”生成长期记忆`
})

function triggerAiSummary() {
  const trigger = Number(settingsDraft.midTermTrigger) || DEFAULT_SETTINGS.midTermTrigger
  const keep = Math.max(0, Math.floor(Number(settingsDraft.midTermKeep) || DEFAULT_SETTINGS.midTermKeep))

  const mid = midItems.value.map(x => x.content)
  const keepArr = keep <= 0 ? [] : mid.slice(Math.max(0, mid.length - keep))

  const customMid = String(settingsDraft.midTermFormat || '').trim()
  const customLong = String(settingsDraft.longTermFormat || '').trim()

  const baseUrl = resolveAiBaseUrl({ preset: settingsStore.aiProviderPreset, customBaseUrl: settingsStore.customApiUrl })
  const canRunAi = String(settingsStore.aiModel || '').trim() && String(baseUrl || '').trim()

  if (!canRunAi) {
    const prompt =
      '请将【中期记忆】总结为1条【长期记忆】（要求精炼、包含人物/势力/地点/任务/重要变化），并用 tavern_commands 更新存档。\n' +
      '输出必须是标准游戏响应JSON（包含 text 与 tavern_commands）。\n' +
      'tavern_commands 要求：\n' +
      '- push 到 key="记忆.长期记忆" 追加1条总结结果（string）\n' +
      `- set key="记忆.中期记忆" value=${JSON.stringify(keepArr)}（保留最新${keep}条，其余转化）\n` +
      '- 不要删除记忆对象本身；不要把数组设为 null。\n' +
      (customMid ? `\n【自定义中期格式】\n${customMid}\n` : '') +
      (customLong ? `\n【自定义长期格式】\n${customLong}\n` : '') +
      `\n【当前中期记忆(${mid.length}/${trigger})】\n` +
      mid.map((x, i) => `${i + 1}. ${x}`).join('\n')

    emit('fill-action', prompt)
    return
  }

  void (async () => {
    if (summarizing.value) return
    try {
      summarizing.value = true
      noticeText.value = 'AI总结中...'

      const resp = await runMemorySummary({
        saveData: gameState.toSaveData(),
        midItems: mid,
        midTermKeep: keep,
        preset: settingsStore.aiProviderPreset,
        customApiUrl: settingsStore.customApiUrl,
        apiKey: String((settingsStore.customApiKey || '').trim()),
        model: String((settingsStore.aiModel || '').trim()),
        temperature: settingsStore.aiTemperature,
        maxOutputTokens: Math.max(512, settingsStore.aiMaxOutputTokens),
        allowPromptOverrides: settingsStore.useImportedPromptOverrides,
        memorySummaryMode: settingsStore.memorySummaryMode,
        stream: settingsStore.aiStreaming
      })

      gameState.applyCommands(resp.tavern_commands)
      await characterStore.saveCurrentGame(undefined, undefined, { toast: false })
      loadFromState()
      noticeText.value = 'AI总结完成，已写入长期记忆'
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      noticeText.value = `AI总结失败：${msg}`
    } finally {
      summarizing.value = false
    }
  })()
}

async function refreshFromSave() {
  if (refreshing.value) return
  try {
    refreshing.value = true
    const active = (characterStore as any).当前激活存档 as any
    if (!active?.角色ID || !active?.存档槽位) {
      noticeText.value = '没有激活的存档，无法刷新'
      return
    }
    await characterStore.loadSaveAndApply(active.角色ID, active.存档槽位)
    loadFromState()
    noticeText.value = '已从存档刷新记忆数据'
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    noticeText.value = `刷新失败：${msg}`
  } finally {
    refreshing.value = false
  }
}

function clearByFilter() {
  const ok = window.confirm('确定清空当前筛选下的记忆？')
  if (!ok) return

  if (currentFilter.value === 'short') shortItems.value = []
  else if (currentFilter.value === 'medium') midItems.value = []
  else if (currentFilter.value === 'long') longItems.value = []
  else {
    shortItems.value = []
    midItems.value = []
    longItems.value = []
  }

  applyToState()
  noticeText.value = '已清空'
}

function removeOne(m: MemoryItem) {
  const ok = window.confirm('确定删除该条记忆？')
  if (!ok) return

  if (m.type === 'short') shortItems.value = shortItems.value.filter(x => x.key !== m.key)
  if (m.type === 'medium') midItems.value = midItems.value.filter(x => x.key !== m.key)
  if (m.type === 'long') longItems.value = longItems.value.filter(x => x.key !== m.key)

  applyToState()
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      noticeText.value = '已复制'
      return
    }
  } catch {
    void 0
  }

  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    noticeText.value = '已复制'
  } finally {
    document.body.removeChild(ta)
  }
}

function copyCurrent() {
  const text = filteredItems.value.map(x => `${typeIcon(x.type)} ${x.time} ${x.content}`).join('\n\n')
  void copyText(text)
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadMemoryJson() {
  const payload = {
    记忆: {
      短期记忆: shortItems.value.map(x => x.content),
      中期记忆: midItems.value.map(x => x.content),
      长期记忆: longItems.value.map(x => x.content),
      隐式中期记忆: Array.isArray(memoryState.value?.隐式中期记忆) ? memoryState.value.隐式中期记忆 : []
    },
    exportedAt: new Date().toISOString()
  }
  downloadBlob(`dad_memory_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8')
}

function exportNovel() {
  const list: any[] = Array.isArray((gameState as any).叙事历史) ? (gameState as any).叙事历史 : []
  if (list.length === 0) {
    noticeText.value = '暂无叙事历史可导出'
    return
  }

  const lines: string[] = []
  lines.push(`# ${String((gameState as any).角色基础信息?.名字 || '无名')} 的修行札记`)
  lines.push('')

  for (const n of list) {
    const role = n?.role === 'user' ? '你' : '天道'
    const t = String(n?.createdAt || '')
    lines.push(`【${role} | ${t}】`)
    lines.push(String(n?.text || ''))
    lines.push('')
  }

  downloadBlob(`dad_novel_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`, lines.join('\n'), 'text/plain;charset=utf-8')
  noticeText.value = '已导出'
}

onMounted(() => {
  loadSettings()
  loadFromState()
})

watch(
  memoryState,
  () => {
    loadFromState()
  },
  { immediate: true }
)
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-btn {
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-1);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}

.body {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 14px;
}

.tabs-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface-3);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 10px;
}

.tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.tab {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tab.active {
  background: rgba(59, 130, 246, 0.85);
  border-color: rgba(59, 130, 246, 0.85);
}

.tab-count {
  font-size: 12px;
  background: rgba(71, 85, 105, 0.8);
  color: var(--text-muted);
  border-radius: 999px;
  padding: 2px 8px;
}

.tab-count.active {
  background: rgba(255, 255, 255, 0.95);
  color: rgba(59, 130, 246, 0.95);
}

.tab-icon {
  font-size: 12px;
}

.card {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 12px;
}

.card-title {
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin: 8px 0;
}

.k {
  color: var(--text-muted);
}

.v {
  color: var(--text-1);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.btn {
  border: 1px solid var(--color-border);
  background: rgba(59, 130, 246, 0.85);
  color: white;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn.btn-ghost {
  background: transparent;
  color: var(--text-1);
}

.input {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  border-radius: 10px;
  padding: 6px 10px;
}

.textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  border-radius: 10px;
  padding: 8px 10px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mem-item {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.mem-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 12px;
  margin-bottom: 6px;
}

.mem-type {
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  padding: 2px 8px;
}

.mem-type.short {
  border-color: rgba(245, 158, 11, 0.5);
}

.mem-type.medium {
  border-color: rgba(96, 165, 250, 0.5);
}

.mem-type.long {
  border-color: rgba(167, 139, 250, 0.5);
}

.mem-content {
  color: var(--text-1);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.mem-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 12px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: rgba(236, 72, 153, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.muted {
  color: var(--text-muted);
}
</style>
