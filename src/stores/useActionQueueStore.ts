import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { useCharacterStore } from './useCharacterStore'
import { useGameStateStore } from './useGameStateStore'

export type PendingActionType = 'equip' | 'unequip' | 'cultivate' | 'dao' | 'comprehend' | 'use'

export type PendingAction = {
  id: string
  timestamp: number
  type: PendingActionType
  itemName: string
  itemType?: string
  description?: string
  payload?: any
}

const STORAGE_KEY_PREFIX = 'dad_action_queue'
const TTL_MS = 24 * 60 * 60 * 1000

function buildStorageKey(active: { 角色ID: string; 存档槽位: string } | null | undefined): string {
  if (active?.角色ID && active?.存档槽位) return `${STORAGE_KEY_PREFIX}:${active.角色ID}:${active.存档槽位}`
  return STORAGE_KEY_PREFIX
}

function safeLoad(storageKey: string): PendingAction[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const cutoff = Date.now() - TTL_MS
    return parsed
      .filter(x => x && typeof x === 'object')
      .map(x => ({
        id: String((x as any).id || ''),
        timestamp: Number((x as any).timestamp || 0),
        type: String((x as any).type || '') as PendingActionType,
        itemName: String((x as any).itemName || ''),
        itemType: (x as any).itemType ? String((x as any).itemType) : undefined,
        description: (x as any).description ? String((x as any).description) : undefined,
        payload: (x as any).payload
      }))
      .filter(x => x.id && x.itemName && Number.isFinite(x.timestamp) && x.timestamp > cutoff)
  } catch {
    return []
  }
}

function safeSave(storageKey: string, actions: PendingAction[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(actions))
  } catch {
    void 0
  }
}

function formatActionLine(a: PendingAction) {
  if (a.description) return a.description
  if (a.type === 'equip') return `装备了《${a.itemName}》${a.itemType ? a.itemType : ''}`
  if (a.type === 'unequip') return `卸下了《${a.itemName}》`
  if (a.type === 'cultivate') return `修炼了《${a.itemName}》`
  if (a.type === 'comprehend') return `深入感悟《${a.itemName}》，领悟其中奥义`
  if (a.type === 'dao') return `三千大道：${a.itemName}`
  if (a.type === 'use') return `使用了《${a.itemName}》`
  return a.itemName
}

export const useActionQueueStore = defineStore('actionQueue', () => {
  const characterStore = useCharacterStore()
  const gameState = useGameStateStore()
  const storageKey = ref<string>(buildStorageKey(characterStore.当前激活存档))

  const pendingActions = ref<PendingAction[]>(safeLoad(storageKey.value))

  watch(
    () => characterStore.当前激活存档,
    next => {
      const nextKey = buildStorageKey(next)
      if (nextKey === storageKey.value) return
      storageKey.value = nextKey
      pendingActions.value = safeLoad(storageKey.value)
    },
    { deep: true }
  )

  function persist() {
    safeSave(storageKey.value, pendingActions.value)
  }

  function clearActions() {
    pendingActions.value = []
    persist()
  }

  function removeAction(id: string) {
    const idx = pendingActions.value.findIndex(x => x.id === id)
    if (idx >= 0) {
      const [removed] = pendingActions.value.splice(idx, 1)
      persist()
      return removed
    }
    return null
  }

  function addAction(action: Omit<PendingAction, 'id' | 'timestamp'>) {
    const next: PendingAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now()
    }

    if (next.type === 'equip') {
      pendingActions.value = pendingActions.value.filter(x => !(x.type === 'unequip' && x.itemName === next.itemName))
    } else if (next.type === 'unequip') {
      pendingActions.value = pendingActions.value.filter(x => !(x.type === 'equip' && x.itemName === next.itemName))
    }

    if (next.type === 'cultivate') {
      pendingActions.value = pendingActions.value.filter(x => x.type !== 'cultivate')
    }

    if (next.type === 'comprehend') {
      pendingActions.value = pendingActions.value.filter(x => x.type !== 'comprehend')
    }

    const dupIdx = pendingActions.value.findIndex(x => x.type === next.type && x.itemName === next.itemName)
    if (dupIdx >= 0) pendingActions.value[dupIdx] = next
    else pendingActions.value.push(next)

    persist()
  }

  function getActionPrompt(): string {
    if (!pendingActions.value.length) return ''
    const lines = pendingActions.value.map(a => `• ${formatActionLine(a)}`).join('\n')
    const comprehends = pendingActions.value.filter(a => a.type === 'comprehend')
    const uses = pendingActions.value.filter(a => a.type === 'use')
    const cultivates = pendingActions.value.filter(a => a.type === 'cultivate')
    const comprehendHint =
      comprehends.length > 0
        ? `\n\n【三千大道规则】\n当存在“深入感悟某大道”的最近操作时：\n- 你必须在回应中体现该感悟的结果\n- 并在 tavern_commands 中更新该大道的数值：三千大道.大道列表.<道名>.当前经验 / 总经验 / 当前阶段（必要时推进阶段并结算剩余经验）`
        : ''
    const useHint =
      uses.length > 0
        ? `\n\n【物品使用规则】\n当存在“使用物品”的最近操作时：\n- 你必须在回应中体现该物品带来的效果（恢复/增益/解除状态/触发事件等）\n- 并在 tavern_commands 中更新存档以结算该效果（例如：玩家角色状态.气血/灵气/神识/寿命、玩家角色状态.状态效果、记忆、叙事历史等）。\n- 若物品描述为“无特殊效果”，则应体现“未发生明显变化/仅做尝试”等结果，不要凭空强行加数值。`
        : ''

    const cultivateHint =
      cultivates.length > 0
        ? (() => {
            const curTechId = String((gameState as any)?.修炼功法?.物品ID || '').trim()
            const last = cultivates[cultivates.length - 1]
            const desc = String(last?.description || '').trim()

            const mDays = desc.match(/进行\s*(\d+)\s*天/)
            const days = mDays ? Math.max(1, Math.floor(Number(mDays[1]) || 0)) : 0
            const mDelta = desc.match(/进度\s*\+\s*(\d+)/)
            const delta = mDelta ? Math.max(1, Math.floor(Number(mDelta[1]) || 0)) : 0

            const timeHint = days > 0 ? `深度修炼${days}天建议推进 游戏时间.分钟 +${days * 1440}` : '普通修炼建议推进 游戏时间.分钟（例如 +30~120）'
            const techHint = curTechId
              ? `当前修炼功法ID：${curTechId}（可用于更新背包.物品.${curTechId}.修炼进度）`
              : '当前修炼功法ID未知（若你能从上下文推断ID，则更新对应背包.物品.<功法ID>.修炼进度）'

            const progressHint = delta > 0 ? `本次提示中包含“进度+${delta}”，可据此更新功法修炼进度` : '功法修炼进度增量需与叙事一致（0-100范围内）'

            return (
              `\n\n【修炼规则】\n当存在“修炼功法/深度修炼”的最近操作时：\n- 你必须在回应中体现该修炼过程与结果（不要跳过）。\n- 并在 tavern_commands 中结算修炼带来的数值变化：\n  - add 玩家角色状态.境界.当前进度（正数，必须出现；否则修为进度不会变化）\n  - add 游戏时间.分钟（必须出现；${timeHint}）\n  - add 背包.物品.<功法ID>.修炼进度（可选但强烈建议；${progressHint}）\n\n${techHint}`
            )
          })()
        : ''
    return `\n\n【玩家最近操作】\n在本轮对话前，玩家进行了以下操作：\n${lines}\n\n⚠️重要提醒：请优先基于这些玩家操作来生成回应！先处理和反映这些具体动作的结果，然后再回应用户输入的文本内容。这些操作具有更高的优先级，应该在叙事中得到明确体现。`
      + comprehendHint
      + useHint
      + cultivateHint
  }

  function consumeActions(): string {
    const txt = getActionPrompt()
    if (txt) clearActions()
    return txt
  }

  return { pendingActions, addAction, removeAction, clearActions, getActionPrompt, consumeActions }
})
