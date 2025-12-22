import { defineStore } from 'pinia'

import { qiankunbaoku } from '../services/qiankunbaoku'
import { formatRelativeTime } from '../utils/time'
import { useGameStateStore } from './useGameStateStore'
import { useUIStore } from './useUIStore'

type Mode = '单机' | '联机'

export type SaveMetadata = {
  存档名: string
  角色ID: string
  存档槽位: string
  保存时间: string
  境界: string
  位置: string
  游戏内时间: string
  版本: string
}

export type CharacterData = {
  角色ID: string
  角色名: string
  模式: Mode
  创建时间: string
  存档列表?: Record<string, SaveMetadata>
  存档?: SaveMetadata
}

type ActiveSaveRef = { 角色ID: string; 存档槽位: string }

type CharacterStoreState = {
  角色列表: Record<string, CharacterData>
  当前角色ID: string | null
  当前激活存档: ActiveSaveRef | null
  loading: boolean
}

type ExportBundle = {
  exportedAt: string
  version: string
  metadata: {
    角色列表: Record<string, CharacterData>
    当前角色ID: string | null
    当前激活存档: ActiveSaveRef | null
  }
  saves: Record<string, any>
}

function nowIso() {
  return new Date().toISOString()
}

function buildGameTimeString(saveData: any) {
  const t = saveData?.游戏时间
  if (!t) return '未知'
  return `${t.年}年${t.月}月${t.日}日`
}

function extractSaveMetaFromSaveData(characterId: string, slotKey: string, saveData: any): SaveMetadata {
  const playerState = saveData?.玩家角色状态
  return {
    存档名: slotKey,
    角色ID: characterId,
    存档槽位: slotKey,
    保存时间: String(saveData?.saveTime || nowIso()),
    境界: playerState?.境界?.名称 || '凡人',
    位置: playerState?.位置?.描述 || '未知',
    游戏内时间: buildGameTimeString(saveData),
    版本: 'v0.2'
  }
}

function getInitial(charName: string) {
  return charName?.trim()?.slice(0, 1) || '？'
}

export const useCharacterStore = defineStore('character', {
  state: (): CharacterStoreState => ({
    角色列表: {},
    当前角色ID: null,
    当前激活存档: null,
    loading: false
  }),
  getters: {
    currentCharacter(state: CharacterStoreState) {
      return state.当前角色ID ? state.角色列表[state.当前角色ID] : null
    },
    currentSaveMeta(state: CharacterStoreState): SaveMetadata | null {
      if (!state.当前激活存档) return null
      const char = state.角色列表[state.当前激活存档.角色ID]
      if (!char) return null
      if (char.模式 === '联机') return char.存档 || null
      return char.存档列表?.[state.当前激活存档.存档槽位] || null
    },
    currentInitial(): string {
      const char = (this as any).currentCharacter as CharacterData | null
      if (!char) return '？'
      return getInitial(char.角色名)
    }
  },
  actions: {
    requireCurrentCharacterId(): string {
      if (!this.当前角色ID) throw new Error('未选择角色')
      return this.当前角色ID
    },

    async loadMetadataFromIndexedDB() {
      this.loading = true
      try {
        const meta = await qiankunbaoku.$v()
        if (meta) {
          this.角色列表 = meta.角色列表 || {}
          this.当前角色ID = meta.当前角色ID || null
          this.当前激活存档 = meta.当前激活存档 || null
        }

        if (!this.当前角色ID || !this.角色列表[this.当前角色ID]) {
          this.当前角色ID = null
          this.当前激活存档 = null
        }

        const active = this.当前激活存档
        if (active?.角色ID && active?.存档槽位) {
          try {
            await this.loadSaveAndApply(active.角色ID, active.存档槽位)
          } catch (e) {
            console.warn(
              '[存档系统] 刷新后自动加载激活存档失败，将继续使用当前状态：',
              e instanceof Error ? e.message : e
            )
          }
        }

        await this.commitMetadataToStorage()
      } finally {
        this.loading = false
      }
    },

    createCharacter(name: string, mode: Mode) {
      const id = `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      this.角色列表[id] = {
        角色ID: id,
        角色名: name,
        模式: mode,
        创建时间: nowIso(),
        存档列表: mode === '单机' ? {} : undefined,
        存档: mode === '联机' ? (null as any) : undefined
      }
      return id
    },

    setActive(characterId: string, slotKey: string) {
      this.当前角色ID = characterId
      this.当前激活存档 = { 角色ID: characterId, 存档槽位: slotKey }
    },

    listSavesForCurrentCharacter() {
      const char = (this as any).currentCharacter as CharacterData | null
      if (!char) return [] as SaveMetadata[]

      if (char.模式 === '联机') {
        return char.存档 ? [char.存档] : []
      }

      const list = Object.entries(char.存档列表 || {})
        .filter(([slot]) => slot && slot !== '上次对话')
        .map(([, meta]) => meta)

      list.sort((a, b) => (b.保存时间 || '').localeCompare(a.保存时间 || ''))
      return list
    },

    getSaveCountLabel() {
      const char = (this as any).currentCharacter as CharacterData | null
      if (!char) return '0/10'
      if (char.模式 === '联机') return char.存档 ? '1/1' : '0/1'
      const count = Object.keys(char.存档列表 || {}).filter((k) => k !== '上次对话').length
      return `${count}/10`
    },

    async saveCurrentGame(
      characterId?: string,
      slotKey?: string,
      options?: { toast?: boolean; loadingText?: string; successText?: string; errorText?: string }
    ) {
      const gameState = useGameStateStore()
      const saveData = gameState.toSaveData()

      const cid = characterId || this.当前角色ID
      const slot = slotKey || this.当前激活存档?.存档槽位
      if (!cid || !slot) throw new Error('没有激活的存档，无法保存！')

      const char = this.角色列表[cid]
      if (!char) throw new Error('角色不存在')

      const uiStore = useUIStore()
      const enableToast = options?.toast !== false
      const loadingId = enableToast ? uiStore.showLoading(options?.loadingText || '正在保存…') : 0

      try {
        await qiankunbaoku.dc(cid, slot, saveData)

        const playerState = saveData.玩家角色状态
        const meta: SaveMetadata = {
          存档名: slot,
          角色ID: cid,
          存档槽位: slot,
          保存时间: nowIso(),
          境界: playerState?.境界?.名称 || '凡人',
          位置: playerState?.位置?.描述 || '未知',
          游戏内时间: buildGameTimeString(saveData),
          版本: 'v0.2'
        }

        if (char.模式 === '联机') {
          char.存档 = meta
        } else {
          if (!char.存档列表) char.存档列表 = {}
          char.存档列表[slot] = meta
        }

        this.setActive(cid, slot)
        await this.commitMetadataToStorage()

        if (enableToast) {
          uiStore.resolveLoading(loadingId, options?.successText || '保存成功', 'success')
        }

        return meta
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (enableToast) {
          uiStore.resolveLoading(loadingId, options?.errorText || `保存失败：${msg}`, 'error', 3200)
        }
        throw e
      }
    },

    async saveToSlot(slotKey: string, characterId?: string) {
      const cid = characterId || this.当前角色ID
      if (!cid) throw new Error('未选择角色')
      const slot = String(slotKey || '').trim()
      if (!slot) throw new Error('存档名称无效')

      const prevActive = this.当前激活存档 ? { ...this.当前激活存档 } : null
      const uiStore = useUIStore()
      const isAuto = slot === '时间点存档'
      const loadingId = uiStore.showLoading(isAuto ? '正在自动存档…' : '正在保存…')
      try {
        await this.saveCurrentGame(cid, slot, { toast: false })
        uiStore.resolveLoading(loadingId, isAuto ? '已自动存档' : '保存成功', 'success')
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        uiStore.resolveLoading(loadingId, `${isAuto ? '自动存档失败' : '保存失败'}：${msg}`, 'error', 3200)
        throw e
      } finally {
        if (prevActive) {
          this.setActive(prevActive.角色ID, prevActive.存档槽位)
          await this.commitMetadataToStorage()
        }
      }
    },

    async loadSaveAndApply(characterId: string, slotKey: string) {
      const data = await qiankunbaoku.loadSaveData(characterId, slotKey)
      if (!data) throw new Error('存档数据不存在！')
      const gameState = useGameStateStore()
      gameState.fromSaveData(data)
      this.setActive(characterId, slotKey)
      await this.commitMetadataToStorage()
    },

    async renameSave(characterId: string, oldSlotKey: string, newSlotKey: string) {
      const char = this.角色列表[characterId]
      if (!char) throw new Error('角色不存在')
      if (char.模式 !== '单机') throw new Error('无法重命名：角色不存在或非单机模式')

      const oldKey = String(oldSlotKey || '').trim()
      const nextKey = String(newSlotKey || '').trim()
      if (!oldKey || !nextKey) throw new Error('存档名称无效')
      if (oldKey === '上次对话' || oldKey === '时间点存档') throw new Error('该存档不可重命名')
      if (nextKey === '上次对话' || nextKey === '时间点存档') throw new Error('该名称不可用')
      if (oldKey === nextKey) return

      if (!char.存档列表?.[oldKey]) throw new Error(`存档【${oldKey}】不存在`)
      if (char.存档列表?.[nextKey]) throw new Error('存档名称已存在，请使用其他名称。')

      const data = await qiankunbaoku.loadSaveData(characterId, oldKey)
      if (!data) throw new Error('无法加载存档数据')

      await qiankunbaoku.dc(characterId, nextKey, data)
      await qiankunbaoku.Jx(characterId, oldKey)

      const baseMeta = char.存档列表[oldKey]
      delete char.存档列表[oldKey]
      char.存档列表[nextKey] = {
        ...baseMeta,
        存档名: nextKey,
        存档槽位: nextKey,
        保存时间: nowIso()
      }

      if (this.当前激活存档?.角色ID === characterId && this.当前激活存档?.存档槽位 === oldKey) {
        this.setActive(characterId, nextKey)
      }

      await this.commitMetadataToStorage()
    },

    async importCharacterFile(jsonText: string) {
      const raw = JSON.parse(jsonText) as any
      if (raw?.type === 'character' && raw?.character?.角色ID) {
        const incomingId = String(raw.character.角色ID)
        if (this.角色列表[incomingId]) {
          throw new Error(`角色ID ${incomingId} 已存在，创建失败！`)
        }

        const incomingChar = raw.character.角色信息 as any
        const name = String(incomingChar?.角色基础信息?.名字 || incomingChar?.角色名 || '未命名')
        const mode = (incomingChar?.模式 as Mode) || '单机'

        const char: CharacterData = {
          角色ID: incomingId,
          角色名: name,
          模式: mode,
          创建时间: String(incomingChar?.创建时间 || nowIso()),
          存档列表: mode === '单机' ? {} : undefined,
          存档: mode === '联机' ? (null as any) : undefined
        }

        this.角色列表[incomingId] = char

        const incomingSaves = (raw.character.存档列表 || []) as any[]
        for (const s of incomingSaves) {
          const slotKey = String(s?.存档名 || s?.存档槽位 || '存档1')
          const saveData = s?.存档数据
          if (!saveData) continue
          await qiankunbaoku.dc(incomingId, slotKey, saveData)
          if (mode === '联机') {
            char.存档 = extractSaveMetaFromSaveData(incomingId, slotKey, saveData)
          } else {
            if (!char.存档列表) char.存档列表 = {}
            char.存档列表[slotKey] = extractSaveMetaFromSaveData(incomingId, slotKey, saveData)
          }
        }

        await this.commitMetadataToStorage()
        return
      }

      await this.importBundle(jsonText)
    },

    async importSavesFileIntoCharacter(characterId: string, jsonText: string) {
      const char = this.角色列表[characterId]
      if (!char) throw new Error('角色不存在')
      if (char.模式 !== '单机') throw new Error('无法导入：角色不存在或非单机模式')

      const raw = JSON.parse(jsonText) as any
      if (raw?.type !== 'saves' || !Array.isArray(raw?.saves)) {
        throw new Error('无效的存档文件格式')
      }

      for (const s of raw.saves as any[]) {
        const slotKey = String(s?.存档名 || s?.存档槽位 || '存档1')
        const saveData = s?.存档数据
        if (!saveData) continue
        await qiankunbaoku.dc(characterId, slotKey, saveData)
        if (!char.存档列表) char.存档列表 = {}
        char.存档列表[slotKey] = extractSaveMetaFromSaveData(characterId, slotKey, saveData)
      }

      await this.commitMetadataToStorage()
    },

    async deleteCharacter(characterId: string) {
      const char = this.角色列表[characterId]
      if (!char) throw new Error('角色不存在')

      if (this.当前激活存档?.角色ID === characterId) {
        const gameState = useGameStateStore()
        gameState.$reset()
        this.当前激活存档 = null
      }

      await qiankunbaoku.clearCharacterSaves(characterId)
      delete this.角色列表[characterId]

      if (this.当前角色ID === characterId) {
        this.当前角色ID = null
      }

      const remainingIds = Object.keys(this.角色列表)
      if (remainingIds.length === 0) {
        this.当前角色ID = null
        this.当前激活存档 = null
        await this.commitMetadataToStorage()
        return
      }

      if (!this.当前角色ID || !this.角色列表[this.当前角色ID]) {
        const nextId = remainingIds[0]
        const nextChar = this.角色列表[nextId]
        if (nextChar?.模式 === '单机') {
          const slots = Object.keys(nextChar.存档列表 || {}).filter((k) => k !== '上次对话')
          const slot = slots[0] || '存档1'
          this.setActive(nextId, slot)
        } else {
          const slot = nextChar?.存档?.存档槽位 || '存档'
          this.setActive(nextId, slot)
        }
      }

      await this.commitMetadataToStorage()
    },

    async deleteSave(characterId: string, slotKey: string) {
      const char = this.角色列表[characterId]
      if (!char) throw new Error('角色不存在')

      if (char.模式 !== '单机') {
        throw new Error('无法删除：角色不存在或非单机模式')
      }

      if (slotKey === '上次对话' || slotKey === '时间点存档') {
        throw new Error('该存档不可删除')
      }

      const saves = Object.keys(char.存档列表 || {}).filter((k) => k !== '上次对话')
      if (saves.length <= 1) {
        throw new Error('最后一个存档不能删除')
      }

      const slotLabel = char.存档列表?.[slotKey]?.存档名 || slotKey
      if (!char.存档列表?.[slotKey]) {
        throw new Error(`存档【${slotLabel}】不存在`)
      }

      await qiankunbaoku.Jx(characterId, slotKey)
      delete (char.存档列表 || {})[slotKey]

      if (this.当前激活存档?.角色ID === characterId && this.当前激活存档?.存档槽位 === slotKey) {
        const next = saves.find((k) => k !== slotKey) || saves[0]
        this.setActive(characterId, next)
      }

      await this.commitMetadataToStorage()
    },

    async duplicateSave(characterId: string, slotKey: string) {
      const data = await qiankunbaoku.loadSaveData(characterId, slotKey)
      if (!data) throw new Error('存档数据不存在！')

      const newSlot = this.getNextSaveSlot(characterId)
      await qiankunbaoku.dc(characterId, newSlot, data)

      const char = this.角色列表[characterId]
      if (char?.模式 === '单机') {
        const baseMeta = (char.存档列表 || {})[slotKey]
        const meta: SaveMetadata = {
          存档名: newSlot,
          角色ID: characterId,
          存档槽位: newSlot,
          保存时间: nowIso(),
          境界: baseMeta?.境界 || '凡人',
          位置: baseMeta?.位置 || '未知',
          游戏内时间: baseMeta?.游戏内时间 || '未知',
          版本: baseMeta?.版本 || 'v0.2'
        }
        if (!char.存档列表) char.存档列表 = {}
        char.存档列表[newSlot] = meta
      }

      await this.commitMetadataToStorage()
      return newSlot
    },

    async exportSave(characterId: string, slotKey: string) {
      const data = await qiankunbaoku.loadSaveData(characterId, slotKey)
      if (!data) throw new Error('存档数据不存在！')
      return JSON.stringify(data, null, 2)
    },

    async exportSaveFile(characterId: string, slotKey: string) {
      const char = this.角色列表[characterId]
      if (!char) throw new Error('角色不存在')

      const meta = char.模式 === '联机' ? char.存档 : char.存档列表?.[slotKey]
      const data = await qiankunbaoku.loadSaveData(characterId, slotKey)
      if (!data) throw new Error('存档数据不存在！')

      const bundle = {
        type: 'saves',
        saves: [
          {
            ...(meta || extractSaveMetaFromSaveData(characterId, slotKey, data)),
            存档名: slotKey,
            存档数据: data
          }
        ],
        exportTime: nowIso(),
        version: '1.0.0',
        characterId,
        characterName: (char as any)?.角色基础信息?.名字 || char.角色名
      }

      return JSON.stringify(bundle, null, 2)
    },

    async exportCharacterFile(characterId: string) {
      const char = this.角色列表[characterId]
      if (!char) throw new Error('角色不存在')

      const slots: string[] = []
      if (char.模式 === '联机') {
        if (char.存档) slots.push(char.存档.存档槽位 || '存档')
      } else {
        slots.push(...Object.keys(char.存档列表 || {}).filter((k) => k !== '上次对话'))
      }

      const savesWithData = [] as any[]
      for (const slot of slots) {
        const data = await qiankunbaoku.loadSaveData(characterId, slot)
        if (!data) continue
        const meta = char.模式 === '联机' ? char.存档 : char.存档列表?.[slot]
        savesWithData.push({
          ...(meta || extractSaveMetaFromSaveData(characterId, slot, data)),
          存档名: slot,
          存档数据: data
        })
      }

      const bundle = {
        type: 'character',
        character: {
          角色ID: characterId,
          角色信息: char,
          存档列表: savesWithData
        },
        exportTime: nowIso(),
        version: '1.0.0'
      }

      return JSON.stringify(bundle, null, 2)
    },

    getNextSaveSlot(characterId: string) {
      const char = this.角色列表[characterId]
      if (!char || char.模式 !== '单机') return '存档1'
      const existing = new Set(Object.keys(char.存档列表 || {}))
      for (let i = 1; i <= 10; i++) {
        const slot = `存档${i}`
        if (!existing.has(slot)) return slot
      }
      return `存档${Date.now()}`
    },

    async commitMetadataToStorage() {
      const cloned = JSON.parse(
        JSON.stringify({
          角色列表: this.角色列表,
          当前角色ID: this.当前角色ID,
          当前激活存档: this.当前激活存档
        })
      )

      await qiankunbaoku.c5(cloned)
      this.角色列表 = { ...this.角色列表 }
    },

    async exportCurrentCharacterBundle(): Promise<string> {
      const characterId = this.requireCurrentCharacterId()
      const char = this.角色列表[characterId]
      if (!char) throw new Error('角色不存在')

      const slots: string[] = []
      if (char.模式 === '联机') {
        if (char.存档) {
          slots.push(char.存档.存档槽位 || '联机存档')
        }
      } else {
        slots.push(...Object.keys(char.存档列表 || {}).filter((k) => k !== '上次对话'))
      }

      const saves: Record<string, any> = {}
      for (const slot of slots) {
        const data = await qiankunbaoku.loadSaveData(characterId, slot)
        if (data) saves[`${characterId}_${slot}`] = data
      }

      const bundle: ExportBundle = {
        exportedAt: nowIso(),
        version: 'v0.2',
        metadata: {
          角色列表: { [characterId]: char },
          当前角色ID: characterId,
          当前激活存档: this.当前激活存档 && this.当前激活存档.角色ID === characterId ? this.当前激活存档 : null
        },
        saves
      }

      return JSON.stringify(bundle, null, 2)
    },

    async exportAllBundle(): Promise<string> {
      const saves: Record<string, any> = {}

      for (const characterId of Object.keys(this.角色列表)) {
        const char = this.角色列表[characterId]
        if (!char) continue

        if (char.模式 === '联机') {
          if (char.存档) {
            const slot = char.存档.存档槽位 || '联机存档'
            const data = await qiankunbaoku.loadSaveData(characterId, slot)
            if (data) saves[`${characterId}_${slot}`] = data
          }
        } else {
          for (const slot of Object.keys(char.存档列表 || {}).filter((k) => k !== '上次对话')) {
            const data = await qiankunbaoku.loadSaveData(characterId, slot)
            if (data) saves[`${characterId}_${slot}`] = data
          }
        }
      }

      const bundle: ExportBundle = {
        exportedAt: nowIso(),
        version: 'v0.2',
        metadata: {
          角色列表: this.角色列表,
          当前角色ID: this.当前角色ID,
          当前激活存档: this.当前激活存档
        },
        saves
      }

      return JSON.stringify(bundle, null, 2)
    },

    async importBundle(jsonText: string) {
      const bundle = JSON.parse(jsonText) as Partial<ExportBundle>
      if (!bundle.metadata || !bundle.metadata.角色列表) {
        throw new Error('无效的存档文件格式')
      }

      const incomingChars = bundle.metadata.角色列表
      const incomingSaves = bundle.saves || {}

      for (const [characterId, char] of Object.entries(incomingChars)) {
        this.角色列表[characterId] = char as any
      }

      for (const [key, data] of Object.entries(incomingSaves)) {
        const idx = key.lastIndexOf('_')
        if (idx <= 0) continue
        const characterId = key.slice(0, idx)
        const slotKey = key.slice(idx + 1)
        await qiankunbaoku.dc(characterId, slotKey, data)
      }

      this.当前角色ID = bundle.metadata.当前角色ID || this.当前角色ID
      this.当前激活存档 = bundle.metadata.当前激活存档 || this.当前激活存档

      await this.commitMetadataToStorage()
    },

    async clearAllSaveData() {
      await qiankunbaoku.clearAllSaves()
      await qiankunbaoku.clearAllMetadata()

      this.角色列表 = {}
      this.当前角色ID = null
      this.当前激活存档 = null

      await this.commitMetadataToStorage()
    },

    formatRelativeTime(iso: string) {
      return formatRelativeTime(iso)
    }
  }
})
