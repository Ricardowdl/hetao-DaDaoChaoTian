<template>
  <div class="quest-root">
    <div class="body">
      <div class="row-top">
        <div class="row-title">任务</div>
        <div class="row-actions">
          <button class="btn btn-ghost" type="button" style="display: none" :disabled="refreshing" @click="refresh">⟳</button>
          <button class="btn btn-ghost" type="button" @click="configOpen = true">⚙</button>
          <button class="btn" type="button" :disabled="generating" @click="requestGenerate">寻找机缘</button>
        </div>
      </div>

      <div v-if="configOpen" class="config-overlay" @click.self="configOpen = false">
        <div class="config-dialog" @click.stop>
          <div class="config-header">
            <div class="config-title">任务系统设置</div>
            <button class="close-btn" type="button" @click="configOpen = false">×</button>
          </div>

          <div class="config-content">
            <div class="config-section">
              <label class="config-label">启用系统任务</label>
              <div class="config-row">
                <input class="config-checkbox" type="checkbox" v-model="cfgEnabled" />
              </div>
            </div>

            <div class="config-section">
              <label class="config-label">系统任务类型</label>
              <select class="config-select" v-model="cfgSystemType">
                <option value="修仙辅助系统">修仙辅助系统</option>
                <option value="道侣养成系统">道侣养成系统</option>
                <option value="宗门发展系统">宗门发展系统</option>
                <option value="探索冒险系统">探索冒险系统</option>
                <option value="战斗挑战系统">战斗挑战系统</option>
                <option value="资源收集系统">资源收集系统</option>
              </select>
            </div>

            <div class="config-section">
              <label class="config-label">默认任务数量</label>
              <div class="range-row">
                <input class="range-input" type="range" min="1" max="10" step="1" v-model.number="cfgCount" />
                <span class="range-value">{{ cfgCount }}</span>
              </div>
            </div>

            <div class="config-section">
              <label class="config-row">
                <input class="config-checkbox" type="checkbox" v-model="cfgAuto" />
                <span>自动刷新</span>
              </label>
              <div class="config-desc">完成任务后自动生成新任务</div>
            </div>

            <div class="config-section">
              <label class="config-label">系统任务提示词</label>
              <textarea class="config-textarea" rows="3" v-model="cfgPrompt" placeholder="自定义任务生成提示词..." />
            </div>
          </div>

          <div class="config-actions">
            <button class="config-btn-secondary" type="button" @click="configOpen = false">取消</button>
            <button class="config-btn-primary" type="button" @click="saveConfig">保存</button>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button v-for="t in tabRows" :key="t.key" class="tab" type="button" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
          {{ t.key }} ({{ t.count }})
        </button>
      </div>

      <div class="filters">
        <button
          v-for="c in categories"
          :key="c"
          class="chip"
          type="button"
          :class="{ active: activeCategory === c }"
          @click="activeCategory = c"
        >
          {{ c }}
        </button>
      </div>

      <div v-if="filteredQuests.length === 0" class="empty">
        <div class="muted">暂无{{ activeTab === '全部' ? '' : activeTab }}任务</div>
        <div class="muted" style="margin-top: 6px">点击上方“寻找机缘”按钮获取新任务</div>
      </div>

      <div v-else class="quest-list">
        <button v-for="q in filteredQuests" :key="q.任务ID" type="button" class="quest-item" :class="{ active: selectedQuestId === q.任务ID }" @click="selectedQuestId = q.任务ID">
          <div class="qi-main">
            <div class="qi-title">{{ q.任务名称 || q.任务ID }}</div>
            <div class="qi-sub">{{ q.任务类型 || '未分类' }} · {{ q.任务状态 || '进行中' }}</div>
            <div class="qi-desc" v-if="q.任务描述">{{ q.任务描述 }}</div>

            <div v-if="Array.isArray(q.目标列表) && q.目标列表.length" class="obj-list">
              <div v-for="(o, idx) in q.目标列表" :key="idx" class="obj">
                <span class="pill" :class="{ ok: !!o.已完成 }">{{ o.已完成 ? '✓' : '·' }}</span>
                <span class="muted">{{ o.描述 || o.类型 || '目标' }}：{{ Number(o.当前进度 ?? 0) || 0 }}/{{ Number(o.需求数量 ?? 0) || 0 }}</span>
              </div>
            </div>
          </div>
          <div class="qi-side">
            <button class="delete-quest-btn" type="button" title="删除任务" @click.stop="removeQuest(q.任务ID)">×</button>
          </div>
        </button>

        <div v-if="selectedQuest" class="card" style="margin-top: 12px">
          <div class="card-title">任务详情</div>
          <div class="kv"><span class="k">任务ID</span><span class="v">{{ selectedQuest.任务ID }}</span></div>
          <div class="kv"><span class="k">名称</span><span class="v">{{ selectedQuest.任务名称 }}</span></div>
          <div class="kv"><span class="k">类型</span><span class="v">{{ selectedQuest.任务类型 }}</span></div>
          <div class="kv"><span class="k">状态</span><span class="v">{{ selectedQuest.任务状态 || '进行中' }}</span></div>
          <div class="kv"><span class="k">接取时间</span><span class="v">{{ String(selectedQuest.接取时间 || '-') }}</span></div>
          <div class="kv"><span class="k">完成时间</span><span class="v">{{ String(selectedQuest.完成时间 || '-') }}</span></div>
          <div class="muted" style="margin-top: 8px">{{ selectedQuest.任务描述 || '-' }}</div>

          <div v-if="Array.isArray(selectedQuest.目标列表) && selectedQuest.目标列表.length" class="subcard">
            <div class="sub-title">目标列表</div>
            <div class="list">
              <div v-for="(o, idx) in selectedQuest.目标列表" :key="idx" class="list-item">
                <div class="li-main">
                  <div class="li-title">{{ o.描述 || o.类型 || '目标' }}</div>
                  <div class="li-sub">{{ Number(o.当前进度 ?? 0) || 0 }}/{{ Number(o.需求数量 ?? 0) || 0 }} {{ o.已完成 ? '(已完成)' : '' }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedQuest.奖励" class="subcard">
            <div class="sub-title">奖励</div>
            <div class="json-pre">{{ safeStringify(selectedQuest.奖励) }}</div>
          </div>

          <div class="actions" style="justify-content: flex-start">
            <button class="btn" type="button" :disabled="!canFinish(selectedQuest)" @click="requestFinishReward">完成任务</button>
          </div>
        </div>
      </div>

      <div class="muted" v-if="noticeText" style="margin-top: 8px">{{ noticeText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import { runQuestGeneration } from '../services/questGeneration'
import { runQuestCompletion } from '../services/questCompletion'
import type { TavernCommand } from '../services/tavernCommands'

const emit = defineEmits<{
  (e: 'fill-action', text: string): void
  (e: 'fill-and-send', text: string): void
}>()

const gameState = useGameStateStore()
const characterStore = useCharacterStore()
const settingsStore = useSettingsStore()
const uiStore = useUIStore()

const questSystem = computed<any>(() => (gameState as any).任务系统 || null)

const questList = computed<any[]>(() => {
  const list = questSystem.value?.当前任务列表
  return Array.isArray(list) ? list.filter((q: any) => q && q.任务ID && q.任务名称) : []
})

const activeTab = ref<'全部' | '进行中' | '已完成'>('进行中')
const activeCategory = ref('全部')
const selectedQuestId = ref<string>('')
const configOpen = ref(false)

const defaultCategories = ['全部', '宗门', '奇遇', '日常', '系统任务', '道侣培养', '修为提升', '收集资源', '战斗挑战']

const categories = computed(() => {
  const set = new Set<string>()
  for (const x of defaultCategories) set.add(x)
  for (const q of questList.value) {
    const t = String(q?.任务类型 || '')
    if (t) set.add(t)
  }
  return Array.from(set)
})

const selectedQuest = computed<any>(() => {
  const id = String(selectedQuestId.value || '')
  if (!id) return null
  return questList.value.find((x: any) => String(x?.任务ID || '') === id) || null
})

watch(
  questList,
  () => {
    if (!selectedQuestId.value && questList.value.length) selectedQuestId.value = String(questList.value[0]?.任务ID || '')
    if (selectedQuestId.value && !selectedQuest.value) selectedQuestId.value = ''
  },
  { immediate: true }
)

const tabRows = computed(() => {
  const all = questList.value
  const done = all.filter((q: any) => String(q?.任务状态 || '进行中') === '已完成')
  const doing = all.filter((q: any) => String(q?.任务状态 || '进行中') !== '已完成')
  return [
    { key: '全部' as const, count: all.length },
    { key: '进行中' as const, count: doing.length },
    { key: '已完成' as const, count: done.length }
  ]
})

const filteredQuests = computed(() => {
  let arr = questList.value
  if (activeTab.value === '进行中') arr = arr.filter((q: any) => String(q?.任务状态 || '进行中') !== '已完成')
  if (activeTab.value === '已完成') arr = arr.filter((q: any) => String(q?.任务状态 || '进行中') === '已完成')
  if (activeCategory.value && activeCategory.value !== '全部') {
    arr = arr.filter((q: any) => String(q?.任务类型 || '') === activeCategory.value)
  }
  return arr
})

function emitAction(text: string) {
  emit('fill-action', text)
}

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function getQuestIndexById(id: string): number {
  const target = String(id || '')
  if (!target) return -1
  const list = questSystem.value?.当前任务列表
  if (!Array.isArray(list)) return -1
  return list.findIndex((q: any) => q && String(q.任务ID || '') === target)
}

function isQuestDone(q: any) {
  return String(q?.任务状态 || '进行中') === '已完成'
}

function canFinish(q: any) {
  if (!q) return false
  if (isQuestDone(q)) return false
  const objs = Array.isArray(q.目标列表) ? q.目标列表 : []
  if (!objs.length) return true
  return objs.every((o: any) => !!o?.已完成 || (Number(o?.当前进度 ?? 0) || 0) >= (Number(o?.需求数量 ?? 0) || 0))
}

function currentGameTimeText() {
  const t: any = (gameState as any).游戏时间
  if (!t) return ''
  const y = Number(t.年)
  const m = Number(t.月)
  const d = Number(t.日)
  const hh = Number(t.小时)
  const mm = Number(t.分钟)
  if (![y, m, d, hh, mm].every(Number.isFinite)) return ''
  return `仙道${Math.floor(y)}年${Math.floor(m)}月${Math.floor(d)}日 ${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor(mm)).padStart(2, '0')}`
}

const noticeText = ref('')
const generating = ref(false)

async function autoRefreshQuestPool(trigger: string) {
  const cfg = questSystem.value?.配置
  if (!cfg || typeof cfg !== 'object') return
  if (!cfg.启用系统任务) return
  if (!cfg.自动刷新) return

  const target = Math.max(1, Math.min(10, Math.floor(Number(cfg.默认任务数量 ?? 3) || 3)))
  const list = Array.isArray(questSystem.value?.当前任务列表) ? questSystem.value.当前任务列表 : []
  const unfinished = list.filter((q: any) => {
    const st = String(q?.任务状态 || '进行中')
    return st !== '已完成' && st !== '失败'
  }).length

  const need = target - unfinished
  if (need <= 0) return

  const meta = getActiveSaveMeta()
  if (!meta) return

  const model = String(settingsStore.aiModel || '').trim()
  if (!model) return

  if (generating.value) return
  generating.value = true
  const loadingId = uiStore.showLoading(`任务池补充中（${trigger}）...`)

  try {
    for (let i = 0; i < need; i++) {
      const resp = await runQuestGeneration({
        saveData: gameState.toSaveData(),
        preset: settingsStore.aiProviderPreset,
        customApiUrl: settingsStore.customApiUrl,
        apiKey: String((settingsStore.customApiKey || '').trim()),
        model,
        temperature: settingsStore.aiTemperature,
        maxOutputTokens: settingsStore.aiMaxOutputTokens,
        allowPromptOverrides: settingsStore.useImportedPromptOverrides,
        stream: false
      })

      const onlyPush = (resp.tavern_commands || []).filter((c: any) => c && c.action === 'push' && c.key === '任务系统.当前任务列表')
      const cmds: TavernCommand[] = [...ensureQuestSystemExists(), ...onlyPush]
      gameState.applyCommands(cmds)
    }

    await characterStore.saveCurrentGame(meta.角色ID, meta.存档槽位, { toast: false })
    uiStore.resolveLoading(loadingId, '任务池已补充', 'success')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    uiStore.resolveLoading(loadingId, `任务池补充失败：${msg}`, 'error', 3200)
  } finally {
    generating.value = false
  }
}

function getActiveSaveMeta(): { 角色ID: string; 存档槽位: string } | null {
  const active: any = (characterStore as any).当前激活存档
  if (!active?.角色ID || !active?.存档槽位) return null
  return { 角色ID: String(active.角色ID), 存档槽位: String(active.存档槽位) }
}

async function saveActiveSilently(): Promise<boolean> {
  const meta = getActiveSaveMeta()
  if (!meta) {
    noticeText.value = '请先加载存档'
    return false
  }
  try {
    await characterStore.saveCurrentGame(meta.角色ID, meta.存档槽位, { toast: false })
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    noticeText.value = `保存失败：${msg}`
    return false
  }
}

function ensureQuestSystemExists(): TavernCommand[] {
  const qs = (gameState as any).任务系统
  if (qs && typeof qs === 'object') return []
  return [
    {
      action: 'set',
      key: '任务系统',
      value: {
        当前任务列表: [],
        任务统计: { 完成总数: 0, 各类型完成: {} },
        配置: {
          启用系统任务: false,
          系统任务类型: '修仙辅助系统',
          默认任务数量: 3,
          自动刷新: true,
          系统任务提示词: ''
        }
      }
    } as TavernCommand
  ]
}

async function removeQuest(id: string) {
  const idx = getQuestIndexById(id)
  if (idx < 0) return
  const cmds: TavernCommand[] = [...ensureQuestSystemExists(), { action: 'delete', key: `任务系统.当前任务列表[${idx}]`, value: null }]
  gameState.applyCommands(cmds)
  noticeText.value = '任务已删除'
  if (selectedQuestId.value === id) selectedQuestId.value = ''
  await saveActiveSilently()
}

async function advanceObjective(questId: string, objectiveIndex: number, delta: number) {
  const idx = getQuestIndexById(questId)
  if (idx < 0) return
  const d = Math.max(0, Math.floor(Number(delta) || 0))
  if (d <= 0) return

  const q = questSystem.value?.当前任务列表?.[idx]
  if (!q || typeof q !== 'object') return
  if (String(q?.任务状态 || '进行中') === '已完成') return

  const obj = Array.isArray(q.目标列表) ? q.目标列表[objectiveIndex] : null
  if (!obj) return

  const cur = Number(obj.当前进度 ?? 0)
  const need = Number(obj.需求数量 ?? 0)
  const base = Number.isFinite(cur) ? cur : 0
  const req = Number.isFinite(need) ? need : 0
  const next = Math.max(0, Math.floor(base + d))

  const cmds: TavernCommand[] = [...ensureQuestSystemExists()]
  cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].目标列表[${objectiveIndex}].当前进度`, value: next })

  if (req > 0 && next >= req) {
    cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].目标列表[${objectiveIndex}].已完成`, value: true })
  }

  // 若所有目标完成：自动标记完成
  const objs = Array.isArray(q.目标列表) ? q.目标列表 : []
  const allDone = objs.every((o: any, i: number) => {
    if (i === objectiveIndex) {
      return req <= 0 ? true : next >= req
    }
    const c = Number(o?.当前进度 ?? 0)
    const n = Number(o?.需求数量 ?? 0)
    if (o?.已完成) return true
    if (Number.isFinite(c) && Number.isFinite(n) && n > 0) return c >= n
    return false
  })

  if (allDone) {
    cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].任务状态`, value: '已完成' })
    cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].完成时间`, value: currentGameTimeText() })

    const type = String(q?.任务类型 || '未分类')
    cmds.push({ action: 'add', key: `任务系统.任务统计.完成总数`, value: 1 })
    cmds.push({ action: 'add', key: `任务系统.任务统计.各类型完成.${type}`, value: 1 })
  }

  gameState.applyCommands(cmds)
  noticeText.value = allDone ? '任务目标已达成，已标记完成' : '任务进度已更新'
  await saveActiveSilently()

  if (allDone) {
    await autoRefreshQuestPool('完成任务')
  }
}

async function finishQuestLocal(questId: string) {
  const idx = getQuestIndexById(questId)
  if (idx < 0) return
  const q = questSystem.value?.当前任务列表?.[idx]
  if (!q) return
  if (!canFinish(q)) {
    noticeText.value = '尚未满足完成条件'
    return
  }

  const cmds: TavernCommand[] = [...ensureQuestSystemExists()]
  cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].任务状态`, value: '已完成' })
  cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].完成时间`, value: currentGameTimeText() })

  const type = String(q?.任务类型 || '未分类')
  cmds.push({ action: 'add', key: `任务系统.任务统计.完成总数`, value: 1 })
  cmds.push({ action: 'add', key: `任务系统.任务统计.各类型完成.${type}`, value: 1 })

  gameState.applyCommands(cmds)
  noticeText.value = '任务已标记完成（奖励请用AI结算）'
  await saveActiveSilently()

  await autoRefreshQuestPool('完成任务')
}

async function failQuest(questId: string) {
  const idx = getQuestIndexById(questId)
  if (idx < 0) return
  const q = questSystem.value?.当前任务列表?.[idx]
  if (!q) return
  if (isQuestDone(q)) return
  const cmds: TavernCommand[] = [...ensureQuestSystemExists()]
  cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].任务状态`, value: '失败' })
  gameState.applyCommands(cmds)
  noticeText.value = '任务已标记失败'
  await saveActiveSilently()

  await autoRefreshQuestPool('任务失败')
}

async function requestGenerate() {
  if (generating.value) return
  const meta = getActiveSaveMeta()
  if (!meta) {
    noticeText.value = '请先加载存档'
    uiStore.showToast('请先加载存档', 'error')
    return
  }

  const model = String(settingsStore.aiModel || '').trim()
  if (!model) {
    noticeText.value = '未选择模型，请先在设置中配置AI'
    uiStore.showToast('未选择模型，请先在设置中配置AI', 'error')
    return
  }

  generating.value = true
  const loadingId = uiStore.showLoading('天机运转中，正在推演机缘...')

  try {
    const resp = await runQuestGeneration({
      saveData: gameState.toSaveData(),
      preset: settingsStore.aiProviderPreset,
      customApiUrl: settingsStore.customApiUrl,
      apiKey: String((settingsStore.customApiKey || '').trim()),
      model,
      temperature: settingsStore.aiTemperature,
      maxOutputTokens: settingsStore.aiMaxOutputTokens,
      allowPromptOverrides: settingsStore.useImportedPromptOverrides,
      stream: false
    })

    const onlyPush = (resp.tavern_commands || []).filter((c: any) => c && c.action === 'push' && c.key === '任务系统.当前任务列表')
    const cmds: TavernCommand[] = [...ensureQuestSystemExists(), ...onlyPush]
    gameState.applyCommands(cmds)
    await characterStore.saveCurrentGame(meta.角色ID, meta.存档槽位, { toast: false })

    const questName = String(resp.quest?.任务名称 || resp.quest?.任务ID || '新任务')
    noticeText.value = `新任务：${questName}`
    uiStore.resolveLoading(loadingId, `新任务：${questName}`, 'success')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    noticeText.value = `生成任务失败：${msg}`
    uiStore.resolveLoading(loadingId, `生成任务失败：${msg}`, 'error', 3200)
  } finally {
    generating.value = false
  }
}

function requestFinishReward() {
  if (!selectedQuest.value) return
  const q = selectedQuest.value
  const questId = String(q?.任务ID || '')
  if (!questId) return

  ;(async () => {
    const meta = getActiveSaveMeta()
    if (!meta) {
      uiStore.showToast('请先加载存档', 'error')
      return
    }

    const model = String(settingsStore.aiModel || '').trim()
    if (!model) {
      uiStore.showToast('未选择模型，请先在设置中配置AI', 'error')
      return
    }

    const idx = getQuestIndexById(questId)
    if (idx < 0) {
      uiStore.showToast('未找到该任务', 'error')
      return
    }

    const loadingId = uiStore.showLoading('正在结算任务奖励...')

    try {
      const resp = await runQuestCompletion({
        saveData: gameState.toSaveData(),
        quest: q,
        preset: settingsStore.aiProviderPreset,
        customApiUrl: settingsStore.customApiUrl,
        apiKey: String((settingsStore.customApiKey || '').trim()),
        model,
        temperature: settingsStore.aiTemperature,
        maxOutputTokens: settingsStore.aiMaxOutputTokens,
        allowPromptOverrides: settingsStore.useImportedPromptOverrides,
        stream: false
      })

      // 仅应用 set/add 且不允许 AI 直接改写 任务系统.*（服务层已过滤）
      const cmds: TavernCommand[] = [...ensureQuestSystemExists(), ...resp.tavern_commands]

      // 原版：最终由系统写入任务完成状态/时间/统计
      const doneTime = currentGameTimeText() || new Date().toISOString()
      cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].任务状态`, value: '已完成' })
      cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].完成时间`, value: doneTime })
      const type = String(q?.任务类型 || '未分类')
      cmds.push({ action: 'add', key: `任务系统.任务统计.完成总数`, value: 1 })
      cmds.push({ action: 'add', key: `任务系统.任务统计.各类型完成.${type}`, value: 1 })

      gameState.applyCommands(cmds)
      await characterStore.saveCurrentGame(meta.角色ID, meta.存档槽位, { toast: false })

      uiStore.resolveLoading(loadingId, `任务完成：${String(q?.任务名称 || questId)}`, 'success')
      noticeText.value = '任务已完成并保存'

      await autoRefreshQuestPool('完成任务')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      uiStore.resolveLoading(loadingId, `完成任务失败：${msg}`, 'error', 3200)
    }
  })()
}

const cfgEnabled = ref(false)
const cfgSystemType = ref('修仙辅助系统')
const cfgCount = ref(3)
const cfgAuto = ref(true)
const cfgPrompt = ref('')

function resetConfigDraft() {
  const cfg = questSystem.value?.配置 || {}
  cfgEnabled.value = !!cfg?.启用系统任务
  cfgSystemType.value = String(cfg?.系统任务类型 || '修仙辅助系统')
  cfgCount.value = Number(cfg?.默认任务数量 ?? 3) || 3
  cfgAuto.value = cfg?.自动刷新 !== undefined ? !!cfg.自动刷新 : true
  cfgPrompt.value = String(cfg?.系统任务提示词 || '')
}

watch(
  questSystem,
  () => {
    resetConfigDraft()
  },
  { immediate: true }
)

async function saveConfig() {
  const cmds: TavernCommand[] = [...ensureQuestSystemExists()]
  cmds.push({ action: 'set', key: '任务系统.配置.启用系统任务', value: !!cfgEnabled.value })
  cmds.push({ action: 'set', key: '任务系统.配置.系统任务类型', value: String(cfgSystemType.value || '修仙辅助系统') })
  cmds.push({ action: 'set', key: '任务系统.配置.默认任务数量', value: Math.max(1, Math.min(10, Math.floor(Number(cfgCount.value) || 3))) })
  cmds.push({ action: 'set', key: '任务系统.配置.自动刷新', value: !!cfgAuto.value })
  cmds.push({ action: 'set', key: '任务系统.配置.系统任务提示词', value: String(cfgPrompt.value || '') })
  gameState.applyCommands(cmds)
  noticeText.value = '配置已保存'
  await saveActiveSilently()
  configOpen.value = false
}

const refreshing = ref(false)

function refresh() {
  if (refreshing.value) return
  ;(async () => {
    try {
      refreshing.value = true
      const active = (characterStore as any).当前激活存档 as any
      if (!active?.角色ID || !active?.存档槽位) {
        noticeText.value = '没有激活的存档，无法刷新任务数据'
        return
      }
      await characterStore.loadSaveAndApply(active.角色ID, active.存档槽位)
      noticeText.value = '任务数据已从存档刷新'
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      noticeText.value = `刷新任务数据失败：${msg}`
    } finally {
      refreshing.value = false
    }
  })()
}
</script>

<style scoped>
.quest-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.body {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 14px;
}

.row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.config-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.65);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 80;
}

.config-dialog {
  width: min(720px, 100%);
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--panel-border);
}

.config-title {
  font-weight: 800;
  color: var(--text-1);
}

.close-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-1);
  cursor: pointer;
}

.config-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-weight: 700;
  color: var(--text-2);
}

.config-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-1);
}

.config-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-1);
  resize: vertical;
}

.config-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.range-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-input {
  flex: 1;
}

.range-value {
  min-width: 32px;
  text-align: right;
  font-weight: 800;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--panel-border);
}

.config-btn-secondary,
.config-btn-primary {
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  cursor: pointer;
  color: var(--text-1);
}

.config-btn-secondary {
  background: rgba(255, 255, 255, 0.06);
}

.config-btn-primary {
  background: rgba(124, 77, 255, 0.25);
}

.row-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(96, 165, 250, 0.95);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid var(--panel-border);
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.tab {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 6px 2px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: rgba(96, 165, 250, 0.95);
  border-bottom-color: rgba(96, 165, 250, 0.95);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.chip {
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}

.chip.active {
  background: rgba(59, 130, 246, 0.85);
  border-color: rgba(59, 130, 246, 0.85);
}

.empty {
  text-align: center;
  padding: 44px 12px;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quest-item {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  cursor: pointer;
}

.quest-item.active {
  border-color: rgba(96, 165, 250, 0.75);
}

.qi-title {
  font-weight: 700;
  color: var(--text-1);
}

.qi-sub {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.qi-desc {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.obj-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.obj {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pill {
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.pill.ok {
  border-color: rgba(34, 197, 94, 0.7);
  color: rgba(34, 197, 94, 0.95);
}

.input {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  border-radius: 10px;
  padding: 6px 10px;
}

.select {
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

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin: 6px 0;
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

.delete-quest-btn {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-1);
  cursor: pointer;
}

.delete-quest-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
}

.muted {
  color: var(--text-muted);
}

.subcard {
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  border-radius: 12px;
  padding: 10px;
  margin-top: 10px;
}

.sub-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.18);
  border-radius: 10px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.li-title {
  font-weight: 700;
}

.li-sub {
  margin-top: 2px;
  font-size: 12px;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.json-pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}

@media (prefers-color-scheme: light) {
  .quest-root {
    color: rgba(15, 23, 42, 0.92);
  }

  .body {
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(15, 23, 42, 0.12);
  }

  .row-title {
    color: rgba(37, 99, 235, 0.95);
  }

  .row-actions .btn {
    background: rgba(37, 99, 235, 0.95);
    border-color: rgba(37, 99, 235, 0.95);
    color: #fff;
  }

  .row-actions .btn.btn-ghost {
    background: rgba(15, 23, 42, 0.04);
    border-color: rgba(15, 23, 42, 0.12);
    color: rgba(15, 23, 42, 0.92);
  }

  .config-dialog {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(15, 23, 42, 0.12);
  }

  .config-title {
    color: rgba(15, 23, 42, 0.92);
  }

  .config-label {
    color: rgba(15, 23, 42, 0.80);
  }

  .config-select,
  .config-textarea {
    background: rgba(248, 250, 252, 0.98);
    border-color: rgba(15, 23, 42, 0.12);
    color: rgba(15, 23, 42, 0.92);
  }

  .config-textarea::placeholder {
    color: rgba(15, 23, 42, 0.45);
  }

  .config-desc {
    color: rgba(15, 23, 42, 0.60);
  }

  .tabs {
    border-bottom-color: rgba(15, 23, 42, 0.10);
  }

  .tab {
    color: rgba(15, 23, 42, 0.55);
  }

  .tab.active {
    color: rgba(37, 99, 235, 0.95);
    border-bottom-color: rgba(37, 99, 235, 0.95);
  }

  .filters {
    background: rgba(15, 23, 42, 0.04);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 12px;
    padding: 8px;
  }

  .chip {
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(15, 23, 42, 0.12);
    color: rgba(15, 23, 42, 0.75);
  }

  .chip.active {
    background: rgba(37, 99, 235, 0.95);
    border-color: rgba(37, 99, 235, 0.95);
    color: #fff;
  }

  .empty {
    padding: 120px 12px;
  }

  .muted {
    color: rgba(15, 23, 42, 0.72);
  }

  .card {
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(15, 23, 42, 0.12);
  }

  .card-title {
    color: rgba(15, 23, 42, 0.92);
  }

  .quest-item {
    background: rgba(248, 250, 252, 0.95);
    border-color: rgba(15, 23, 42, 0.12);
  }

  .qi-title {
    color: rgba(15, 23, 42, 0.92);
  }

  .qi-sub,
  .qi-desc,
  .k {
    color: rgba(15, 23, 42, 0.65);
  }

  .v {
    color: rgba(15, 23, 42, 0.92);
  }

  .subcard {
    background: rgba(248, 250, 252, 0.95);
    border-color: rgba(15, 23, 42, 0.12);
  }

  .list-item {
    background: rgba(248, 250, 252, 0.95);
    border-color: rgba(15, 23, 42, 0.12);
  }

  .li-title {
    color: rgba(15, 23, 42, 0.92);
  }

  .li-sub {
    color: rgba(15, 23, 42, 0.70);
  }

  .pill {
    color: rgba(15, 23, 42, 0.70);
    border-color: rgba(15, 23, 42, 0.18);
  }
}
</style>
