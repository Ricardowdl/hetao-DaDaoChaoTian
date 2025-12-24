<template>
  <div v-if="modelValue" class="overlay" :class="{ 'overlay-map': activeTab === '世界地图' }" @click.self="close">
    <div class="modal" :class="{ 'modal-map': activeTab === '世界地图' }">
      <div class="body" :class="{ 'body-map': activeTab === '世界地图' }">
        <div class="panel">
          <div v-if="activeTab === '修行管理'" class="panel-content">
            <div class="grid-2">
              <div class="card">
                <div class="card-title">境界</div>
                <div class="kv"><span class="k">名称</span><span class="v">{{ (gameState.玩家角色状态 as any)?.境界?.名称 || '未知' }}</span></div>
                <div class="kv"><span class="k">阶段</span><span class="v">{{ (gameState.玩家角色状态 as any)?.境界?.阶段 || '-' }}</span></div>
                <div class="kv"><span class="k">修为</span><span class="v">{{ realmProgressText }}</span></div>
                <div class="hint">{{ (gameState.玩家角色状态 as any)?.境界?.突破描述 || '静心修行，方得寸进。' }}</div>
              </div>

              <div class="card">
                <div class="card-title">状态</div>
                <div class="kv"><span class="k">气血</span><span class="v">{{ statText((gameState.玩家角色状态 as any)?.气血) }}</span></div>
                <div class="kv"><span class="k">灵气</span><span class="v">{{ statText((gameState.玩家角色状态 as any)?.灵气) }}</span></div>
                <div class="kv"><span class="k">神识</span><span class="v">{{ statText((gameState.玩家角色状态 as any)?.神识) }}</span></div>
                <div class="kv"><span class="k">寿命</span><span class="v">{{ statText((gameState.玩家角色状态 as any)?.寿命) }}</span></div>
              </div>
            </div>

            <div class="grid-2">
              <div class="card">
                <div class="card-title">声望</div>
                <div class="fame-value">{{ fameText }}</div>
              </div>

              <div class="card">
                <div class="card-title">天赋神通</div>
                <div v-if="talents.length === 0" class="muted">暂无天赋</div>
                <div v-for="t in talents" :key="t" class="pill">{{ t }}</div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">状态效果</div>
              <div v-if="effects.length === 0" class="muted">暂无状态效果</div>
              <div v-for="e in effects" :key="e" class="list-item">
                <div class="li-main">
                  <div class="li-title">{{ e }}</div>
                </div>
              </div>
            </div>

          </div>

          <div v-else-if="activeTab === '背包物品'" class="panel-content">
            <BackpackPanel />
          </div>

          <div v-else-if="activeTab === '人物详情'" class="panel-content">
            <div class="grid-2">
              <div class="card">
                <div class="card-title">基础信息</div>
                <div class="kv"><span class="k">名字</span><span class="v">{{ (gameState.角色基础信息 as any)?.名字 || '-' }}</span></div>
                <div class="kv"><span class="k">性别</span><span class="v">{{ (gameState.角色基础信息 as any)?.性别 || '-' }}</span></div>
                <div class="kv"><span class="k">年龄</span><span class="v">{{ (gameState.角色基础信息 as any)?.年龄 ?? '-' }}</span></div>
                <div class="kv"><span class="k">位置</span><span class="v">{{ (gameState.玩家角色状态 as any)?.位置?.描述 || '-' }}</span></div>
              </div>

              <div class="card">
                <div class="card-title">天赋</div>
                <div v-if="talents.length === 0" class="muted">暂无天赋</div>
                <div v-for="t in talents" :key="t" class="pill">{{ t }}</div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">状态效果</div>
              <div v-if="effects.length === 0" class="muted">暂无状态效果</div>
              <div v-for="e in effects" :key="e" class="list-item">
                <div class="li-main">
                  <div class="li-title">{{ e }}</div>
                </div>
              </div>
            </div>

            <div class="actions">
              <button class="btn" type="button" @click="emitAction('查看自身修为、属性与状态效果详情')">查看详细属性</button>
            </div>
          </div>

          <div v-else-if="activeTab === '修炼功法'" class="panel-content">
            <CultivationPanel @fill-action="emitAction" />
          </div>

          <div v-else-if="activeTab === '三千大道'" class="panel-content">
            <DaoPanel @fill-action="emitAction" />
          </div>

          <div v-else-if="activeTab === '人物关系'" class="panel-content">
            <RelationshipPanel @fill-action="emitAction" />
          </div>

          <div v-else-if="activeTab === '宗门信息'" class="panel-content">
            <SectPanel @fill-action="emitAction" />
          </div>

          <div v-else-if="activeTab === '任务日志'" class="panel-content">
            <QuestLogPanel @fill-action="emitAction" @fill-and-send="emitAndSend" />
          </div>

          <div v-else-if="activeTab === '世界地图'" class="panel-content">
            <WorldMapPanel @fill-action="emitAction" />
          </div>

          <div v-else-if="activeTab === '记忆中心'" class="panel-content">
            <MemoryCenterPanel @fill-action="emitAction" />
          </div>

          <div v-else-if="activeTab === '保存游戏'" class="panel-content">
            <SaveGamePanel />
          </div>

          <div v-else-if="activeTab === '游戏变量'" class="panel-content">
            <GameVariablesPanel @fill-action="emitAction" />
          </div>

          <div v-else-if="activeTab === '提示词管理'" class="panel-content">
            <div class="grid-2">
              <div class="card">
                <div class="card-title">提示词列表</div>
                <div class="actions" style="justify-content: flex-start">
                  <button class="btn" type="button" @click="exportPrompts">导出</button>
                  <button class="btn" type="button" @click="importPrompts">导入</button>
                  <button class="btn btn-ghost" type="button" @click="reloadPrompts">刷新</button>
                </div>
                <div v-if="promptGroups.length === 0" class="muted" style="margin-top: 8px">加载中...</div>
                <div v-for="g in promptGroups" :key="g.key" class="group">
                  <div class="group-title">{{ g.info.name }}</div>
                  <button v-for="p in g.prompts" :key="p.key" class="prompt-item" type="button" :class="{ active: selectedPromptKey === p.key }" @click="selectPrompt(p.key)">
                    <span class="pi-title">{{ p.name }}</span>
                    <span class="pi-sub">{{ p.modified ? '已修改' : '默认' }}</span>
                  </button>
                </div>
              </div>

              <div class="card">
                <div class="card-title">编辑</div>
                <div v-if="!selectedPrompt" class="muted">请选择一个提示词</div>
                <template v-else>
                  <div class="kv"><span class="k">Key</span><span class="v">{{ selectedPrompt.key }}</span></div>
                  <div class="kv"><span class="k">说明</span><span class="v">{{ selectedPrompt.description }}</span></div>
                  <textarea class="textarea" v-model="editContent" />
                  <div class="actions" style="justify-content: flex-start">
                    <button class="btn" type="button" :disabled="savingPrompt" @click="savePrompt">保存</button>
                    <button class="btn btn-ghost" type="button" :disabled="savingPrompt" @click="resetPrompt">重置</button>
                    <button class="btn btn-ghost" type="button" @click="copyText(editContent)">复制</button>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div v-else class="panel-content">
            <div class="muted">未实现：{{ activeTab }}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <button class="btn btn-ghost" type="button" @click="close">关闭</button>
      </div>
    </div>

    <div v-if="jsonViewer" class="overlay2" @click.self="jsonViewer = null">
      <div class="modal2">
        <div class="header">
          <div class="title">详情</div>
          <button class="icon-btn" type="button" @click="jsonViewer = null">✕</button>
        </div>
        <div class="body2">
          <div class="actions" style="justify-content: flex-start; margin-bottom: 10px">
            <button class="btn" type="button" @click="copyText(safeStringify(jsonViewer))">复制</button>
          </div>
          <div class="json-pre">{{ safeStringify(jsonViewer) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import BackpackPanel from './BackpackPanel.vue'
import CultivationPanel from './CultivationPanel.vue'
import DaoPanel from './DaoPanel.vue'
import RelationshipPanel from './RelationshipPanel.vue'
import SectPanel from './SectPanel.vue'
import QuestLogPanel from './QuestLogPanel.vue'
import WorldMapPanel from './WorldMapPanel.vue'
import MemoryCenterPanel from './MemoryCenterPanel.vue'
import SaveGamePanel from './SaveGamePanel.vue'
import GameVariablesPanel from './GameVariablesPanel.vue'
import { promptStore, type PromptEntry } from '../services/promptStore'
import type { PromptCategoryInfo, PromptCategoryKey } from '../config/promptDefaults'
import { downloadTextFile } from '../utils/download'

const props = defineProps<{ modelValue: boolean; tab?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'fill-action', text: string): void
  (e: 'fill-and-send', text: string): void
}>()

const characterStore = useCharacterStore()
const gameState = useGameStateStore()

const tabs = [
  { key: '修行管理', title: '修行管理' },
  { key: '背包物品', title: '背包物品' },
  { key: '人物详情', title: '人物详情' },
  { key: '修炼功法', title: '修炼功法' },
  { key: '三千大道', title: '三千大道' },
  { key: '人物关系', title: '人物关系' },
  { key: '宗门信息', title: '宗门信息' },
  { key: '任务日志', title: '任务日志' },
  { key: '世界地图', title: '世界地图' },
  { key: '记忆中心', title: '记忆中心' },
  { key: '保存游戏', title: '保存游戏' },
  { key: '游戏变量', title: '游戏变量' },
  { key: '提示词管理', title: '提示词管理' }
] as const

type TabKey = (typeof tabs)[number]['key']

const activeTab = ref<TabKey>('修行管理')

watch(
  () => props.tab,
  v => {
    if (v && tabs.some(t => t.key === v)) activeTab.value = v as TabKey
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  v => {
    if (v && activeTab.value === '提示词管理') void reloadPrompts()
  }
)

const activeTitle = computed(() => tabs.find(t => t.key === activeTab.value)?.title || activeTab.value)

function close() {
  emit('update:modelValue', false)
}

function setTab(k: TabKey) {
  activeTab.value = k
  if (k === '提示词管理') void reloadPrompts()
}

function emitAction(text: string) {
  emit('fill-action', text)
}

function emitAndSend(text: string) {
  emit('fill-and-send', text)
}

function statText(stat: any) {
  if (!stat) return '-'
  const cur = stat?.当前 ?? stat?.current ?? 0
  const max = stat?.上限 ?? stat?.max ?? 0
  return `${cur} / ${max}`
}

const realmProgressText = computed(() => {
  const r: any = (gameState.玩家角色状态 as any)?.境界
  const cur = typeof r?.当前进度 === 'number' ? r.当前进度 : null
  const need = typeof r?.下一级所需 === 'number' ? r.下一级所需 : null
  if (cur != null && need != null) return `${cur}/${need}`
  return '-'
})

const talents = computed(() => {
  const list = (gameState.角色基础信息 as any)?.天赋
  if (!Array.isArray(list)) return []
  return list.map((x: any) => String(x?.名称 || x?.name || '')).filter(Boolean)
})

const effects = computed(() => {
  const list = (gameState.玩家角色状态 as any)?.状态效果
  if (!Array.isArray(list)) return []
  return list
    .map((e: any) => {
      const name = String(e?.状态名称 || '')
      const desc = String(e?.状态描述 || '')
      return desc ? `${name}：${desc}` : name
    })
    .filter(Boolean)
})

const fameText = computed(() => {
  const v = Number((gameState.玩家角色状态 as any)?.声望 ?? 0)
  if (v >= 1000) return `名震八方（${v}）`
  if (v >= 200) return `小有名气（${v}）`
  if (v >= 50) return `略有耳闻（${v}）`
  if (v > 0) return `默默无闻（${v}）`
  return '籍籍无名'
})

const cultivationMethod = computed(() => (gameState as any).修炼功法 || (gameState as any).功法 || null)

const skills = computed(() => {
  const list = (gameState as any).掌握技能
  if (!Array.isArray(list)) return [] as Array<{ title: string; subtitle: string; value: any }>
  return list.map((x: any, idx: number) => {
    const title = String(x?.名称 || x?.name || `技能${idx + 1}`)
    const subtitle = String(x?.描述 || x?.desc || '点击查看详情')
    return { title, subtitle, value: x }
  })
})

const daoData = computed(() => (gameState as any).三千大道 || (gameState as any).道途 || null)

const factions = computed(() => {
  const world = (gameState as any).世界信息
  const list = world?.势力信息
  if (!Array.isArray(list)) return [] as Array<{ key: string; title: string; subtitle: string; value: any }>
  return list.map((x: any, idx: number) => {
    const title = String(x?.name || x?.名称 || `势力${idx + 1}`)
    const subtitle = String(x?.description || x?.描述 || '点击查看详情')
    return { key: `${idx}`, title, subtitle, value: x }
  })
})

const quests = computed(() => {
  const sd: any = gameState as any
  const list = sd.任务日志 || sd.任务 || sd.quests
  if (!Array.isArray(list)) return [] as Array<{ key: string; title: string; subtitle: string; value: any }>
  return list.map((x: any, idx: number) => {
    const title = String(x?.标题 || x?.title || `任务${idx + 1}`)
    const subtitle = String(x?.进度 || x?.status || x?.描述 || x?.description || '点击查看详情')
    return { key: `${idx}`, title, subtitle, value: x }
  })
})

const mapFilter = ref('')

const locations = computed(() => {
  const world = (gameState as any).世界信息
  const list = world?.地点信息
  if (!Array.isArray(list)) return [] as Array<{ key: string; title: string; subtitle: string; value: any }>
  return list.map((x: any, idx: number) => {
    const title = String(x?.name || x?.名称 || x?.描述 || `地点${idx + 1}`)
    const subtitle = String(x?.description || x?.描述 || x?.类型 || '')
    return { key: `${idx}`, title, subtitle, value: x }
  })
})

const filteredLocations = computed(() => {
  const q = mapFilter.value.trim().toLowerCase()
  if (!q) return locations.value
  return locations.value.filter(x => x.title.toLowerCase().includes(q) || x.subtitle.toLowerCase().includes(q))
})

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
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
  } finally {
    document.body.removeChild(ta)
  }
}

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

const jsonViewer = ref<any>(null)

function showJson(v: any) {
  jsonViewer.value = v
}

const promptGroups = ref<Array<{ key: PromptCategoryKey; info: PromptCategoryInfo; prompts: PromptEntry[] }>>([])
const selectedPromptKey = ref<string>('')
const selectedPrompt = ref<PromptEntry | null>(null)
const editContent = ref('')
const savingPrompt = ref(false)

async function reloadPrompts() {
  const groups = await promptStore.loadByCategory()
  promptGroups.value = (Object.entries(groups) as Array<[PromptCategoryKey, { info: PromptCategoryInfo; prompts: PromptEntry[] }]>)
    .map(([k, v]) => ({ key: k, info: v.info, prompts: v.prompts }))
}

function selectPrompt(key: string) {
  selectedPromptKey.value = key
  for (const g of promptGroups.value) {
    const found = g.prompts.find(p => p.key === key)
    if (found) {
      selectedPrompt.value = found
      editContent.value = found.content
      return
    }
  }
  selectedPrompt.value = null
  editContent.value = ''
}

async function savePrompt() {
  if (!selectedPrompt.value) return
  try {
    savingPrompt.value = true
    await promptStore.save(selectedPrompt.value.key as any, String(editContent.value || ''))
    await reloadPrompts()
    selectPrompt(selectedPrompt.value.key)
  } finally {
    savingPrompt.value = false
  }
}

async function resetPrompt() {
  if (!selectedPrompt.value) return
  try {
    savingPrompt.value = true
    await promptStore.reset(selectedPrompt.value.key as any)
    await reloadPrompts()
    selectPrompt(selectedPrompt.value.key)
  } finally {
    savingPrompt.value = false
  }
}

async function exportPrompts() {
  const content = await promptStore.exportAll()
  const filename = `dad_prompts_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  downloadTextFile(filename, JSON.stringify(content, null, 2))
}

async function importPrompts() {
  const text = prompt('请粘贴提示词JSON内容：')
  if (!text) return
  const parsed = JSON.parse(text) as Record<string, any>
  await promptStore.importPrompts(parsed)
  await reloadPrompts()
}

onMounted(() => {
  if (props.modelValue && activeTab.value === '提示词管理') void reloadPrompts()
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.65);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 45;
}

.overlay.overlay-map {
  padding: 10px;
}

.modal {
  width: min(980px, 100%);
  max-height: min(760px, calc(var(--app-vh, 100vh) * 0.92));
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr auto;
}

 .modal.modal-map {
  width: min(1520px, 100%);
  max-height: calc(var(--app-vh, 100vh) * 0.98);
 }

 .body {
  padding: 14px 16px;
  overflow: auto;
 }

 .body.body-map {
  overflow: hidden;
  padding: var(--world-map-modal-padding, 18px);
  display: flex;
  flex-direction: column;
  min-height: 0;
 }

 .panel {
  display: grid;
  gap: 14px;
 }

 .body.body-map .panel {
  flex: 1;
  min-height: 0;
 }

 .panel-content {
  display: grid;
  gap: 14px;
 }

 .body.body-map .panel-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
 }

 .grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
 }

 @media (max-width: 860px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
 }

 .card {
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
 }

 .card-title {
  color: var(--text-1);
  margin-bottom: 10px;
 }

 .kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  padding: 4px 0;
 }

 .k {
  color: var(--text-3);
 }

 .v {
  color: var(--text-1);
  text-align: right;
 }

 .hint {
  margin-top: 8px;
  color: var(--text-2);
  line-height: 1.6;
  white-space: pre-wrap;
 }

 .actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
 }

 .btn {
  border: 1px solid var(--panel-border);
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

 .muted {
  color: var(--text-3);
 }

 .group {
  margin-top: 10px;
 }

 .group-title {
  color: var(--text-2);
  font-size: 12px;
  margin: 10px 0 6px;
 }

 .prompt-item {
  text-align: left;
  width: 100%;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-1);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
 }

 .textarea {
  width: 100%;
  min-height: 260px;
  resize: vertical;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-1);
  padding: 10px;
 }

 .json-pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  color: var(--text-1);
  line-height: 1.55;
  white-space: pre-wrap;
 }

.prompt-item.active {
  border-color: rgba(147, 197, 253, 0.35);
  background: rgba(147, 197, 253, 0.12);
}

.pi-sub {
  color: var(--text-3);
  font-size: 12px;
}

.footer {
  padding: 12px 16px;
  border-top: 1px solid var(--panel-border);
  display: flex;
  justify-content: flex-end;
}

.overlay2 {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 60;
}

.modal2 {
  width: min(720px, 100%);
  max-height: min(680px, calc(var(--app-vh, 100vh) * 0.9));
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}

.body2 {
  padding: 14px 16px;
  overflow: auto;
}
</style>
