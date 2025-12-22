import type { SaveData } from '../stores/useGameStateStore'
import type { AiProviderPreset } from '../stores/useSettingsStore'
import type { TavernCommand } from './tavernCommands'

import { runQuestCompletion } from './questCompletion'
import { runQuestGeneration } from './questGeneration'

function getActiveSaveMeta(characterStore: any): { 角色ID: string; 存档槽位: string } | null {
  const active: any = characterStore?.当前激活存档
  if (!active?.角色ID || !active?.存档槽位) return null
  return { 角色ID: String(active.角色ID), 存档槽位: String(active.存档槽位) }
}

function currentGameTimeText(saveData: any) {
  const t: any = saveData?.游戏时间
  if (!t) return ''
  const y = Number(t.年)
  const m = Number(t.月)
  const d = Number(t.日)
  const hh = Number(t.小时)
  const mm = Number(t.分钟)
  if (![y, m, d, hh, mm].every(Number.isFinite)) return ''
  return `仙道${Math.floor(y)}年${Math.floor(m)}月${Math.floor(d)}日 ${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor(mm)).padStart(2, '0')}`
}

function getQuestIndexById(state: any, questId: string): number {
  const list = state?.任务系统?.当前任务列表
  if (!Array.isArray(list)) return -1
  const id = String(questId || '')
  return list.findIndex((q: any) => q && String(q.任务ID || '') === id)
}

function isQuestCompletedState(q: any) {
  const st = String(q?.任务状态 || '进行中')
  return st === '已完成' || st === '失败'
}

function countUnfinished(state: any) {
  const list = state?.任务系统?.当前任务列表
  if (!Array.isArray(list)) return 0
  return list.filter((q: any) => q && !isQuestCompletedState(q)).length
}

async function autoRefreshQuestPool(params: {
  gameState: any
  characterStore: any
  settingsStore: any
  uiStore?: any
  trigger: string
}) {
  const cfg = params.gameState?.任务系统?.配置
  if (!cfg || typeof cfg !== 'object') return
  if (!cfg.启用系统任务) return
  if (!cfg.自动刷新) return

  const target = Math.max(1, Math.min(10, Math.floor(Number(cfg.默认任务数量 ?? 3) || 3)))
  const need = target - countUnfinished(params.gameState)
  if (need <= 0) return

  const meta = getActiveSaveMeta(params.characterStore)
  if (!meta) return

  const model = String(params.settingsStore?.aiModel || '').trim()
  if (!model) return

  const loadingId = params.uiStore?.showLoading ? params.uiStore.showLoading(`任务池补充中（${params.trigger}）...`) : 0

  try {
    for (let i = 0; i < need; i++) {
      const resp = await runQuestGeneration({
        saveData: params.gameState.toSaveData() as SaveData,
        preset: params.settingsStore.aiProviderPreset as AiProviderPreset,
        customApiUrl: params.settingsStore.customApiUrl,
        apiKey: String((params.settingsStore.customApiKey || '').trim()),
        model,
        temperature: params.settingsStore.aiTemperature,
        maxOutputTokens: params.settingsStore.aiMaxOutputTokens,
        allowPromptOverrides: params.settingsStore.useImportedPromptOverrides,
        stream: false
      })

      const onlyPush = (resp.tavern_commands || []).filter((c: any) => c && c.action === 'push' && c.key === '任务系统.当前任务列表')
      params.gameState.applyCommands(onlyPush)
    }

    await params.characterStore.saveCurrentGame(meta.角色ID, meta.存档槽位, { toast: false })
    if (loadingId) params.uiStore.resolveLoading(loadingId, '任务池已补充', 'success')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (loadingId) params.uiStore.resolveLoading(loadingId, `任务池补充失败：${msg}`, 'error', 3200)
  }
}

export async function finishQuest(params: {
  gameState: any
  characterStore: any
  settingsStore: any
  uiStore: any
  questId: string
}): Promise<boolean> {
  const meta = getActiveSaveMeta(params.characterStore)
  if (!meta) {
    params.uiStore.showToast?.('请先加载存档', 'error')
    return false
  }

  const model = String(params.settingsStore?.aiModel || '').trim()
  if (!model) {
    params.uiStore.showToast?.('未选择模型，请先在设置中配置AI', 'error')
    return false
  }

  const idx = getQuestIndexById(params.gameState, params.questId)
  if (idx < 0) {
    params.uiStore.showToast?.('未找到该任务', 'error')
    return false
  }

  const quest = params.gameState?.任务系统?.当前任务列表?.[idx]
  if (!quest) return false

  const loadingId = params.uiStore.showLoading?.('正在结算任务奖励...') || 0

  try {
    const resp = await runQuestCompletion({
      saveData: params.gameState.toSaveData() as SaveData,
      quest,
      preset: params.settingsStore.aiProviderPreset as AiProviderPreset,
      customApiUrl: params.settingsStore.customApiUrl,
      apiKey: String((params.settingsStore.customApiKey || '').trim()),
      model,
      temperature: params.settingsStore.aiTemperature,
      maxOutputTokens: params.settingsStore.aiMaxOutputTokens,
      allowPromptOverrides: params.settingsStore.useImportedPromptOverrides,
      stream: false
    })

    const cmds: TavernCommand[] = [...resp.tavern_commands]

    const doneTime = currentGameTimeText(params.gameState.toSaveData()) || new Date().toISOString()
    cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].任务状态`, value: '已完成' })
    cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].完成时间`, value: doneTime })

    const type = String(quest?.任务类型 || '未分类')
    cmds.push({ action: 'add', key: '任务系统.任务统计.完成总数', value: 1 })
    cmds.push({ action: 'add', key: `任务系统.任务统计.各类型完成.${type}`, value: 1 })

    params.gameState.applyCommands(cmds)
    await params.characterStore.saveCurrentGame(meta.角色ID, meta.存档槽位, { toast: false })

    params.uiStore.resolveLoading?.(loadingId, `任务完成：${String(quest?.任务名称 || params.questId)}`, 'success')

    await autoRefreshQuestPool({
      gameState: params.gameState,
      characterStore: params.characterStore,
      settingsStore: params.settingsStore,
      uiStore: params.uiStore,
      trigger: '完成任务'
    })

    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    params.uiStore.resolveLoading?.(loadingId, `完成任务失败：${msg}`, 'error', 3200)
    return false
  }
}

export async function checkQuestObjective(params: {
  gameState: any
  characterStore: any
  settingsStore: any
  uiStore?: any
  questId: string
  objectiveType: string
  objectiveId: string
}): Promise<{ updated: boolean; completed: boolean }> {
  const state = params.gameState
  const idx = getQuestIndexById(state, params.questId)
  if (idx < 0) return { updated: false, completed: false }

  const quest = state?.任务系统?.当前任务列表?.[idx]
  if (!quest || isQuestCompletedState(quest)) return { updated: false, completed: false }

  const objectives = Array.isArray(quest?.目标列表) ? quest.目标列表 : []
  const objIndex = objectives.findIndex(
    (o: any) => o && String(o.类型 || '') === String(params.objectiveType || '') && String(o.目标ID || '') === String(params.objectiveId || '')
  )
  if (objIndex < 0) return { updated: false, completed: false }

  const obj = objectives[objIndex]
  if (obj?.已完成) return { updated: false, completed: false }

  const cur = Math.max(0, Math.floor(Number(obj?.当前进度 ?? 0) || 0))
  const need = Math.max(0, Math.floor(Number(obj?.需求数量 ?? 0) || 0))
  const next = cur + 1

  const cmds: TavernCommand[] = []
  cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].目标列表[${objIndex}].当前进度`, value: next })
  let nowDone = false
  if (need > 0 && next >= need) {
    cmds.push({ action: 'set', key: `任务系统.当前任务列表[${idx}].目标列表[${objIndex}].已完成`, value: true })
    nowDone = true
  }

  state.applyCommands(cmds)

  const allDone = objectives.every((o: any, i: number) => {
    if (!o || typeof o !== 'object') return true
    if (i === objIndex) {
      if (nowDone) return true
      return need > 0 ? next >= need : true
    }
    if (o.已完成) return true
    const c = Math.max(0, Math.floor(Number(o?.当前进度 ?? 0) || 0))
    const n = Math.max(0, Math.floor(Number(o?.需求数量 ?? 0) || 0))
    if (n <= 0) return true
    return c >= n
  })

  if (allDone) {
    await finishQuest({
      gameState: params.gameState,
      characterStore: params.characterStore,
      settingsStore: params.settingsStore,
      uiStore: params.uiStore || { showToast: () => void 0, showLoading: () => 0, resolveLoading: () => void 0 },
      questId: params.questId
    })
    return { updated: true, completed: true }
  }

  return { updated: true, completed: false }
}
