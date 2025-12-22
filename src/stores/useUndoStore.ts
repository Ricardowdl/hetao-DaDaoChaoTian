import { defineStore } from 'pinia'

import { useActionQueueStore } from './useActionQueueStore'
import { useCharacterStore } from './useCharacterStore'
import { useGameStateStore } from './useGameStateStore'
import { buildEquipCommands, buildUnequipCommands } from '../services/inventory'

type UndoType = 'equip' | 'unequip' | 'use' | 'discard' | 'cultivate'

type UndoAction = {
  type: UndoType
  itemId: string
  itemName: string
  restoreData?: any
  itemData?: any
}

const STORAGE_KEY = 'dao_undo_actions'
const MAX_UNDO = 50

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function ensureEquipSlots(state: any) {
  if (!state.装备栏 || typeof state.装备栏 !== 'object') {
    state.装备栏 = {
      装备1: null,
      装备2: null,
      装备3: null,
      装备4: null,
      装备5: null,
      装备6: null
    }
  }
}

export const useUndoStore = defineStore('undo', {
  state: () => ({
    undoActions: [] as UndoAction[]
  }),
  actions: {
    loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            this.undoActions = parsed
          }
        }
      } catch {
        // ignore
      }
    },
    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.undoActions.slice(-MAX_UNDO)))
      } catch {
        // ignore
      }
    },
    push(action: UndoAction) {
      const record = clone(action)
      this.undoActions.push(record)
      if (this.undoActions.length > MAX_UNDO) {
        this.undoActions = this.undoActions.slice(-MAX_UNDO)
      }
      this.saveToStorage()
    },
    clear() {
      this.undoActions = []
      this.saveToStorage()
    },
    async undoLastAction() {
      if (this.undoActions.length === 0) return false
      const action = this.undoActions.pop() as UndoAction
      this.saveToStorage()
      return this.applyUndo(action)
    },
    async undoByItemName(type: UndoType, itemName: string) {
      const idx = [...this.undoActions].reverse().findIndex(a => a.type === type && a.itemName === itemName)
      if (idx === -1) return false
      const realIndex = this.undoActions.length - 1 - idx
      const action = this.undoActions.splice(realIndex, 1)[0]
      this.saveToStorage()
      return this.applyUndo(action)
    },
    async applyUndo(action: UndoAction) {
      const gameState = useGameStateStore()
      const characterStore = useCharacterStore()
      const queue = useActionQueueStore()
      const state = gameState as any

      ensureEquipSlots(state)
      if (!state.背包 || typeof state.背包 !== 'object') {
        state.背包 = { 灵石: {}, 物品: {} }
      }
      if (!state.背包.物品 || typeof state.背包.物品 !== 'object') {
        state.背包.物品 = {}
      }

      try {
        switch (action.type) {
          case 'use':
          case 'discard':
            if (action.itemData) {
              state.背包.物品[action.itemId] = clone(action.itemData)
            }
            break
          case 'cultivate': {
            if (action.restoreData?.bagItems) {
              state.背包.物品 = clone(action.restoreData.bagItems)
            }
            if ('selectedGongfa' in (action.restoreData || {})) {
              state.修炼功法 = clone(action.restoreData.selectedGongfa)
            }
            break
          }
          case 'equip': {
            const slot = action.restoreData?.slot as any
            const replaced = action.restoreData?.replacedItem
            const equippedItem = state.背包?.物品?.[action.itemId]
            if (slot && equippedItem) {
              const cmds = buildUnequipCommands({ ...equippedItem, 物品ID: action.itemId }, slot as any)
              if (replaced && replaced.物品ID) {
                const backItem = state.背包?.物品?.[replaced.物品ID]
                const fallback = backItem || { 物品ID: replaced.物品ID, 名称: replaced.名称, 类型: '装备' }
                cmds.push(...buildEquipCommands(fallback, slot as any))
              }
              gameState.applyCommands(cmds)
            } else {
              // fallback: just clear slot state
              if (slot && state.装备栏?.[slot]) state.装备栏[slot] = null
              if (state.背包.物品[action.itemId]) state.背包.物品[action.itemId].已装备 = false
              if (replaced && slot) state.装备栏[slot] = { 物品ID: replaced.物品ID, 名称: replaced.名称 }
            }
            break
          }
          case 'unequip': {
            const slot = action.restoreData?.originalSlot as any
            if (slot) {
              const bagItem = state.背包?.物品?.[action.itemId]
              if (bagItem) {
                const cmds = buildEquipCommands({ ...bagItem, 物品ID: action.itemId }, slot as any)
                gameState.applyCommands(cmds)
              } else {
                state.装备栏[slot] = { 物品ID: action.itemId, 名称: action.itemName }
                if (state.背包.物品[action.itemId]) {
                  state.背包.物品[action.itemId] = { ...state.背包.物品[action.itemId], 已装备: true }
                }
              }
            }
            break
          }
        }

        const pending = queue.pendingActions
        for (let i = pending.length - 1; i >= 0; i--) {
          const p = pending[i]
          const typeMatch = p.type === action.type
          const nameMatch = !action.itemName || p.itemName === action.itemName
          if (typeMatch && nameMatch) {
            queue.removeAction(p.id)
            break
          }
        }

        await characterStore.saveCurrentGame(undefined, undefined, { toast: false })
        return true
      } catch (e) {
        console.error('撤销失败', e)
        return false
      }
    }
  }
})
