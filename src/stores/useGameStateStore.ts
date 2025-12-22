import { defineStore } from 'pinia'

import { applyTavernCommands, cleanExpiredEffects, normalizeGameTime, type TavernCommand } from '../services/tavernCommands'
import { rebuildMasteredSkillsFromCultivationItem } from '../services/inventory'
import type { EquipmentSlotKey } from '../services/inventory'

export type GameTime = {
  年: number
  月: number
  日: number
  小时: number
  分钟: number
}

export type BirthDate = {
  年: number
  月: number
  日: number
  小时?: number
  分钟?: number
}

export type StatBar = {
  当前: number
  上限: number
}

export type RealmState = {
  名称: string
  阶段?: string
  当前进度?: number
  下一级所需?: number
  突破描述?: string
}

const REALM_LIFESPAN_BASE: Record<string, number> = {
  凡人: 100,
  炼气: 120,
  筑基: 250,
  金丹: 500,
  元婴: 1000,
  化神: 3000,
  炼虚: 8000,
  合体: 15000,
  渡劫: 30000
}

export type StatusEffect = {
  状态名称: string
  类型: 'buff' | 'debuff'
  生成时间: GameTime
  持续时间分钟: number
  状态描述: string
  强度?: number
  来源?: string
}

export type NarrativeEntry = {
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  stateChanges?: TavernCommand[]
}

export type SaveData = {
  游戏时间: GameTime
  游戏状态?: {
    游戏时间: GameTime
    宗门信息: any
  }
  玩家角色状态: {
    境界: RealmState
    位置: { 描述: string; x: number; y: number }
    声望?: number
    气血?: StatBar
    灵气?: StatBar
    神识?: StatBar
    寿命?: StatBar
    状态效果?: StatusEffect[]
  }
  角色基础信息: {
    名字: string
    性别?: string
    种族?: string
    年龄?: number
    出生日期?: BirthDate
    世界?: any
    天资?: any
    出生?: any
    出身?: any
    灵根?: any
    天赋?: any
    先天六司?: Record<string, number>
    后天六司?: Record<string, number>
  }
  世界信息?: any
  叙事历史?: NarrativeEntry[]
  记忆?: {
    短期记忆: string[]
    中期记忆: string[]
    长期记忆: string[]
    隐式中期记忆: string[]
  }
  背包: {
    灵石: Record<string, number>
    物品: Record<string, any>
  }
  三千大道?: {
    大道列表: Record<string, any>
    当前主修?: string | null
  }
  任务系统?: {
    当前任务列表: any[]
    任务统计: { 完成总数: number; 各类型完成: Record<string, number> }
    配置: {
      启用系统任务: boolean
      系统任务类型: string | string[]
      默认任务数量: number
      自动刷新: boolean
      系统任务提示词: string
    }
  }
  装备栏: {
    装备1: any
    装备2: any
    装备3: any
    装备4: any
    装备5: any
    装备6: any
  }
  宗门信息?: any
  修炼功法?: any
  掌握技能?: any[]
  人物关系: Record<string, any>
  自定义选项?: Record<string, any>
  系统?: {
    nsfwMode?: boolean
    nsfwGenderFilter?: string
  }
  身体部位开发?: any
}

function getShortTermMemoryLimit(): number {
  try {
    const raw = localStorage.getItem('memory-settings')
    if (!raw) return 10
    const parsed = JSON.parse(raw)
    const val =
      Number(parsed?.shortTermLimit) && Number(parsed?.shortTermLimit) > 0
        ? Number(parsed.shortTermLimit)
        : Number(parsed?.maxShortTerm)
    return Number.isFinite(val) && val > 0 ? val : 10
  } catch {
    return 10
  }
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T
}

function removePrivateInfo(state: any) {
  if (!state || typeof state !== 'object') return

  if (!state.系统 || typeof state.系统 !== 'object') {
    state.系统 = { nsfwMode: false, nsfwGenderFilter: '' }
  } else {
    state.系统.nsfwMode = false
    state.系统.nsfwGenderFilter = ''
  }

  if (state.身体部位开发 !== undefined) {
    state.身体部位开发 = {}
  }

  const rel = state.人物关系
  if (rel && typeof rel === 'object') {
    for (const v of Object.values(rel)) {
      if (!v || typeof v !== 'object') continue
      if ((v as any).私密信息 !== undefined) delete (v as any).私密信息
    }
  }
}

function ensureEquipSlots(state: any) {
  if (!state.装备栏 || typeof state.装备栏 !== 'object') {
    state.装备栏 = { 装备1: null, 装备2: null, 装备3: null, 装备4: null, 装备5: null, 装备6: null }
  }
}

function repairEquipmentAndCultivation(state: any) {
  ensureEquipSlots(state)
  if (!state.背包 || typeof state.背包 !== 'object') state.背包 = { 灵石: {}, 物品: {} }
  if (!state.背包.物品 || typeof state.背包.物品 !== 'object') state.背包.物品 = {}

  const cmds: TavernCommand[] = []
  const equipSlots: EquipmentSlotKey[] = ['装备1', '装备2', '装备3', '装备4', '装备5', '装备6']
  const equippedIdsFromSlots = new Set<string>()
  for (const slot of equipSlots) {
    const ref = state.装备栏?.[slot]
    const itemId = ref && typeof ref === 'object' ? String(ref.物品ID || '') : ''
    if (itemId) equippedIdsFromSlots.add(itemId)
  }

  // 先移除已标记装备的增幅，避免重复叠加（原版每次修复都会重算）
  let revertHp = 0
  let revertMp = 0
  let revertSense = 0
  const revertSix: Record<string, number> = { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 }
  for (const [, raw] of Object.entries(state.背包.物品)) {
    const it: any = raw
    if (!it || typeof it !== 'object') continue
    if (String(it.类型) !== '装备') continue
    const itemId = String(it.物品ID || '')
    if (it.已装备 !== true && !equippedIdsFromSlots.has(itemId)) continue
    const bonus = it.装备增幅
    if (bonus && typeof bonus === 'object') {
      const hp = Number(bonus.气血上限)
      const mp = Number(bonus.灵气上限)
      const ss = Number(bonus.神识上限)
      if (Number.isFinite(hp) && hp !== 0) revertHp += hp
      if (Number.isFinite(mp) && mp !== 0) revertMp += mp
      if (Number.isFinite(ss) && ss !== 0) revertSense += ss
      const six = bonus.后天六司
      if (six && typeof six === 'object') {
        for (const k of ['根骨', '灵性', '悟性', '气运', '魅力', '心性']) {
          const d = Number((six as any)[k])
          if (Number.isFinite(d) && d !== 0) revertSix[k] += d
        }
      }
    }
  }
  if (revertHp !== 0) cmds.push({ action: 'add', key: '玩家角色状态.气血.上限', value: -revertHp })
  if (revertMp !== 0) cmds.push({ action: 'add', key: '玩家角色状态.灵气.上限', value: -revertMp })
  if (revertSense !== 0) cmds.push({ action: 'add', key: '玩家角色状态.神识.上限', value: -revertSense })
  for (const [k, v] of Object.entries(revertSix)) {
    if (Number.isFinite(v) && v !== 0) cmds.push({ action: 'add', key: `角色基础信息.后天六司.${k}`, value: -v })
  }

  const equippedIds = new Set<string>()
  const appliedBonusIds = new Set<string>()

  for (const slot of equipSlots) {
    const ref = state.装备栏?.[slot]
    const itemId = ref && typeof ref === 'object' ? String(ref.物品ID || '') : ''
    if (!itemId) {
      state.装备栏[slot] = null
      continue
    }
    equippedIds.add(itemId)
    const bagItem = state.背包.物品[itemId]
    if (!bagItem || typeof bagItem !== 'object') {
      // 补空壳，避免空引用
      state.背包.物品[itemId] = { 物品ID: itemId, 名称: ref?.名称 || itemId, 类型: '装备', 已装备: true }
      continue
    }
    if (bagItem.类型 !== '装备') bagItem.类型 = '装备'
    // 以装备栏为唯一真相：装备栏里出现的装备，必须标记已装备，并且每次修复都按装备栏重算增幅
    cmds.push({ action: 'set', key: `背包.物品.${itemId}.已装备`, value: true })
    if (!appliedBonusIds.has(itemId) && bagItem.装备增幅 && typeof bagItem.装备增幅 === 'object') {
      appliedBonusIds.add(itemId)
      const bonus = bagItem.装备增幅
      if (typeof bonus.气血上限 === 'number' && Number.isFinite(bonus.气血上限)) cmds.push({ action: 'add', key: '玩家角色状态.气血.上限', value: bonus.气血上限 })
      if (typeof bonus.灵气上限 === 'number' && Number.isFinite(bonus.灵气上限)) cmds.push({ action: 'add', key: '玩家角色状态.灵气.上限', value: bonus.灵气上限 })
      if (typeof bonus.神识上限 === 'number' && Number.isFinite(bonus.神识上限)) cmds.push({ action: 'add', key: '玩家角色状态.神识.上限', value: bonus.神识上限 })

      const six = bonus.后天六司
      if (six && typeof six === 'object') {
        for (const k of ['根骨', '灵性', '悟性', '气运', '魅力', '心性']) {
          const d = Number((six as any)[k])
          if (Number.isFinite(d) && d !== 0) cmds.push({ action: 'add', key: `角色基础信息.后天六司.${k}`, value: d })
        }
      }
    }
  }

  // 未在装备栏的装备标记为未装备
  for (const [id, item] of Object.entries(state.背包.物品)) {
    if (String((item as any)?.类型) !== '装备') continue
    if (!equippedIds.has(String(id))) {
      if ((item as any).已装备) cmds.push({ action: 'set', key: `背包.物品.${id}.已装备`, value: false })
    }
  }

  // 功法一致性：修炼功法指针 + 掌握技能重建 + 已装备/修炼中标记
  const gongfaId = state?.修炼功法?.物品ID ? String(state.修炼功法.物品ID) : ''
  const gongfaItem = gongfaId ? state.背包.物品[gongfaId] : null
  const pickFallbackGongfa = () => {
    // 优先：修炼中=true，其次已装备=true，其次修炼进度高的功法
    const all = Object.entries(state.背包.物品).filter(([, v]) => String((v as any)?.类型) === '功法')
    if (all.length === 0) return null
    const sorted = all.sort((a, b) => {
      const va: any = a[1]
      const vb: any = b[1]
      const aCult = va?.修炼中 ? 1 : 0
      const bCult = vb?.修炼中 ? 1 : 0
      if (aCult !== bCult) return bCult - aCult
      const aEq = va?.已装备 ? 1 : 0
      const bEq = vb?.已装备 ? 1 : 0
      if (aEq !== bEq) return bEq - aEq
      const aProg = Number(va?.修炼进度 ?? 0)
      const bProg = Number(vb?.修炼进度 ?? 0)
      return (Number.isFinite(bProg) ? bProg : 0) - (Number.isFinite(aProg) ? aProg : 0)
    })
    return sorted[0]
  }

  if (gongfaId && gongfaItem && String(gongfaItem?.类型) === '功法') {
    if (gongfaItem.已装备 !== true) cmds.push({ action: 'set', key: `背包.物品.${gongfaId}.已装备`, value: true })
    if (gongfaItem.修炼中 !== true) cmds.push({ action: 'set', key: `背包.物品.${gongfaId}.修炼中`, value: true })
    cmds.push({ action: 'set', key: '掌握技能', value: rebuildMasteredSkillsFromCultivationItem(gongfaItem) })
  } else {
    const fallback = pickFallbackGongfa()
    if (fallback) {
      const [fid, fitem] = fallback
      cmds.push({ action: 'set', key: '修炼功法', value: { 物品ID: fid, 名称: (fitem as any).名称 || fid } })
      cmds.push({ action: 'set', key: `背包.物品.${fid}.已装备`, value: true })
      cmds.push({ action: 'set', key: `背包.物品.${fid}.修炼中`, value: true })
      cmds.push({ action: 'set', key: '掌握技能', value: rebuildMasteredSkillsFromCultivationItem(fitem) })
    } else {
      cmds.push({ action: 'set', key: '修炼功法', value: null })
      cmds.push({ action: 'set', key: '掌握技能', value: [] })
    }
  }

  if (cmds.length > 0) {
    applyTavernCommands(state, cmds)
  }

  // 防止出现上限为0/负数导致UI异常
  const ps: any = (state.玩家角色状态 ||= {})
  for (const k of ['气血', '灵气', '神识'] as const) {
    const bar = (ps as any)?.[k]
    if (!bar || typeof bar !== 'object') continue
    const cur = Number(bar.当前)
    let max = Number(bar.上限)
    const curSafe = Number.isFinite(cur) ? cur : 0
    if (!Number.isFinite(max) || max <= 0) {
      max = Math.max(1, Math.floor(curSafe) || 1)
    }
    if (curSafe > max) bar.当前 = max
    if (curSafe < 0) bar.当前 = 0
    bar.上限 = max
  }
}

function normalizeAgeAndLifespan(state: any) {
  const now: GameTime = state?.游戏时间 || { 年: 1, 月: 1, 日: 1, 小时: 8, 分钟: 0 }
  const playerStatus = (state.玩家角色状态 ||= {}) as any
  const base = (state.角色基础信息 ||= {}) as any
  const options = (state.自定义选项 ||= {}) as any

  if (playerStatus.已死亡) {
    return
  }

  if (!playerStatus.寿命 || typeof playerStatus.寿命 !== 'object') {
    playerStatus.寿命 = { 当前: 18, 上限: 80 }
  }

  const rootBone = Number(base?.先天六司?.根骨 ?? 0)
  const defaultMaxFromRootBone = 80 + 5 * (Number.isFinite(rootBone) ? Math.max(0, rootBone) : 0)
  const realmName = String(playerStatus?.境界?.名称 || '凡人')
  const realmBase = REALM_LIFESPAN_BASE[realmName] ?? 100

  const baseline = Math.max(realmBase, defaultMaxFromRootBone)
  const prevBaseline = Number(options?.寿元基准上限)

  let maxNow = Number(playerStatus.寿命.上限)
  if (!Number.isFinite(maxNow) || maxNow <= 0) {
    maxNow = baseline
  }

  if (Number.isFinite(prevBaseline) && prevBaseline > 0) {
    maxNow = maxNow + (baseline - prevBaseline)
  } else {
    if (maxNow === 1000) maxNow = baseline
    if (maxNow < 1) maxNow = baseline
  }
  if (!Number.isFinite(maxNow) || maxNow <= 0) maxNow = baseline

  options.寿元基准上限 = baseline
  playerStatus.寿命.上限 = Math.floor(maxNow)

  const ageFromBase = Number(base.年龄)
  const ageFromShou = Number(playerStatus.寿命?.当前)
  let fallbackAge =
    Number.isFinite(ageFromBase) && ageFromBase > 0
      ? ageFromBase
      : Number.isFinite(ageFromShou) && ageFromShou > 0
        ? ageFromShou
        : 18
  if (!Number.isFinite(fallbackAge) || fallbackAge <= 0 || fallbackAge > 200) {
    fallbackAge = 18
  }
  const curLegacy = Number(playerStatus.寿命?.当前)
  const maxLegacy = Number(playerStatus.寿命?.上限)
  if (curLegacy === 1000 && maxLegacy === 1000) {
    playerStatus.寿命.上限 = Math.max(realmBase, defaultMaxFromRootBone)
    fallbackAge = Number.isFinite(ageFromBase) && ageFromBase > 0 ? Math.min(ageFromBase, 80) : 18
  }

  const birth = base.出生日期 as BirthDate | undefined
  const by = Number(birth?.年)
  const bm = Number(birth?.月)
  const bd = Number(birth?.日)
  const birthValid =
    Number.isFinite(by) &&
    Number.isFinite(bm) &&
    Number.isFinite(bd) &&
    by > 0 &&
    bm >= 1 &&
    bm <= 12 &&
    bd >= 1 &&
    bd <= 31

  if (!birthValid) {
    base.出生日期 = { 年: now.年 - fallbackAge, 月: now.月, 日: now.日, 小时: 0, 分钟: 0 }
    if (base.年龄 !== undefined) base.年龄 = fallbackAge
    playerStatus.寿命.当前 = fallbackAge
    return
  }

  let age = now.年 - by
  if (now.月 < bm || (now.月 === bm && now.日 < bd)) age -= 1
  if (!Number.isFinite(age) || age < 0) age = fallbackAge

  if (base.年龄 !== undefined) base.年龄 = age
  playerStatus.寿命.当前 = age
}

function checkAndMarkDeath(state: any) {
  const ps = state?.玩家角色状态
  if (!ps || typeof ps !== 'object') return

  const hp = Number(ps?.气血?.当前)
  if (Number.isFinite(hp) && hp <= 0) {
    ps.已死亡 = true
    ps.死亡原因 = '气血耗尽'
    return
  }

  const age = Number(ps?.寿命?.当前)
  const max = Number(ps?.寿命?.上限)
  if (Number.isFinite(age) && Number.isFinite(max) && max > 0 && age >= max) {
    if (ps.寿命 && typeof ps.寿命 === 'object') ps.寿命.当前 = max
    ps.已死亡 = true
    ps.死亡原因 = '寿元耗尽'
  }
}

export const useGameStateStore = defineStore('gameState', {
  state: (): SaveData => ({
    游戏时间: { 年: 1000, 月: 1, 日: 1, 小时: 8, 分钟: 0 },
    游戏状态: {
      游戏时间: { 年: 1000, 月: 1, 日: 1, 小时: 8, 分钟: 0 },
      宗门信息: {
        宗门名称: '',
        宗门类型: '',
        职位: '散修',
        贡献: 0,
        关系: '中立',
        声望: 0,
        加入日期: '',
        描述: '',
        师父: '',
        同门关系: [],
        宗门职务: []
      }
    },
    玩家角色状态: {
      境界: { 名称: '凡人', 阶段: '初期', 当前进度: 0, 下一级所需: 100, 突破描述: '' },
      位置: { 描述: '临时位置（等待AI初始化）', x: 1000, y: 1000 },
      声望: 0,
      气血: { 当前: 100, 上限: 100 },
      灵气: { 当前: 50, 上限: 50 },
      神识: { 当前: 30, 上限: 30 },
      寿命: { 当前: 18, 上限: 80 },
      状态效果: []
    },
    角色基础信息: {
      名字: '未命名',
      性别: '男',
      种族: '人族',
      年龄: 18,
      出生日期: { 年: 982, 月: 1, 日: 1, 小时: 0, 分钟: 0 },
      世界: '',
      天资: '',
      出生: '',
      出身: '',
      灵根: null,
      天赋: [],
      先天六司: { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 },
      后天六司: { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 }
    },
    世界信息: undefined,
    叙事历史: [],
    记忆: {
      短期记忆: [],
      中期记忆: [],
      长期记忆: [],
      隐式中期记忆: []
    },
    背包: {
      灵石: { 下品: 0, 中品: 0, 上品: 0, 极品: 0 },
      物品: {}
    },
    三千大道: {
      大道列表: {},
      当前主修: null
    },
    任务系统: {
      当前任务列表: [],
      任务统计: { 完成总数: 0, 各类型完成: {} },
      配置: {
        启用系统任务: false,
        系统任务类型: '修仙辅助系统',
        默认任务数量: 3,
        自动刷新: true,
        系统任务提示词: ''
      }
    },
    装备栏: {
      装备1: null,
      装备2: null,
      装备3: null,
      装备4: null,
      装备5: null,
      装备6: null
    },
    宗门信息: null,
    修炼功法: null,
    掌握技能: [],
    人物关系: {},
    自定义选项: {},
    系统: { nsfwMode: false, nsfwGenderFilter: '' },
    身体部位开发: {}
  }),
  actions: {
    applyCommands(commands: TavernCommand[]) {
      applyTavernCommands(this.$state, commands)

      const gs: any = (this as any).游戏状态

      // 兼容：若AI/旧代码写入 游戏状态.游戏时间，则同步到顶层 游戏时间
      if (gs?.游戏时间 && typeof gs.游戏时间 === 'object') {
        ;(this as any).游戏时间 = gs.游戏时间
      } else if (!(gs?.游戏时间) && this.游戏时间) {
        ;(this as any).游戏状态 = gs && typeof gs === 'object' ? gs : {}
        ;(this as any).游戏状态.游戏时间 = this.游戏时间
      }

      // 兼容：若AI/旧代码写入 游戏状态.宗门信息 或顶层 宗门信息，则互相同步
      if (gs && typeof gs === 'object') {
        if (gs.宗门信息 !== undefined) {
          ;(this as any).宗门信息 = gs.宗门信息
        } else if ((this as any).宗门信息 !== undefined) {
          gs.宗门信息 = (this as any).宗门信息
        }
      }

      normalizeGameTime(this.游戏时间)
      if ((this as any).游戏状态?.游戏时间) normalizeGameTime((this as any).游戏状态.游戏时间)
      normalizeAgeAndLifespan(this.$state)
      checkAndMarkDeath(this.$state)
      cleanExpiredEffects(this.$state)
      repairEquipmentAndCultivation(this.$state)
    },

    appendNarrative(entry: NarrativeEntry) {
      if (!Array.isArray(this.叙事历史)) this.叙事历史 = []
      this.叙事历史.push(entry)
    },

    updateLastAssistantNarrative(params: { text?: string; stateChanges?: TavernCommand[] }) {
      if (!Array.isArray(this.叙事历史) || this.叙事历史.length === 0) return
      const last = this.叙事历史[this.叙事历史.length - 1]
      if (!last || last.role !== 'assistant') return
      if (typeof params.text === 'string') last.text = params.text
      if (params.stateChanges !== undefined) last.stateChanges = params.stateChanges
    },

    normalizeMemoryState() {
      if (!this.记忆 || typeof this.记忆 !== 'object') {
        this.记忆 = { 短期记忆: [], 中期记忆: [], 长期记忆: [], 隐式中期记忆: [] }
        return
      }
      if (!Array.isArray(this.记忆.短期记忆)) this.记忆.短期记忆 = []
      if (!Array.isArray(this.记忆.中期记忆)) this.记忆.中期记忆 = []
      if (!Array.isArray(this.记忆.长期记忆)) this.记忆.长期记忆 = []
      if (!Array.isArray(this.记忆.隐式中期记忆)) this.记忆.隐式中期记忆 = []
    },

    addToShortTermMemory(text: string) {
      this.normalizeMemoryState()

      const t = this.游戏时间
      const minute = t?.分钟 ?? 0
      const timestamp = t
        ? `【仙道${t.年}年${t.月}月${t.日}日 ${String(t.小时).padStart(2, '0')}:${String(minute).padStart(2, '0')}】`
        : '【未知时间】'

      const normalized =
        text.startsWith('【仙道') || text.startsWith('【未知时间】') || text.startsWith('【仙历')
          ? text
          : `${timestamp}${text}`

      this.记忆!.短期记忆.unshift(normalized)
      this.记忆!.隐式中期记忆.unshift(normalized)

      const limit = getShortTermMemoryLimit()
      while (this.记忆!.短期记忆.length > limit) {
        this.记忆!.短期记忆.pop()
        const overflow = this.记忆!.隐式中期记忆.pop()
        if (overflow && !this.记忆!.中期记忆.includes(overflow)) {
          this.记忆!.中期记忆.push(overflow)
        }
      }
    },

    toSaveData() {
      const data = deepClone(this.$state)

      if (!data.玩家角色状态 || !data.游戏时间 || !data.背包 || !data.装备栏) {
        throw new Error('存档数据不完整')
      }

      // 对齐结构：确保 游戏状态 存在，并与顶层字段一致
      if (!data.游戏状态 || typeof data.游戏状态 !== 'object') {
        ;(data as any).游戏状态 = { 游戏时间: data.游戏时间, 宗门信息: (data as any).宗门信息 ?? null }
      }
      if (!(data as any).游戏状态.游戏时间) (data as any).游戏状态.游戏时间 = data.游戏时间
      if ((data as any).游戏状态.宗门信息 === undefined) (data as any).游戏状态.宗门信息 = (data as any).宗门信息 ?? null

      // 将顶层 游戏时间 指向 游戏状态.游戏时间，避免生成两份时间字段
      data.游戏时间 = (data as any).游戏状态.游戏时间
      ;(data as any).宗门信息 = (data as any).游戏状态.宗门信息

      if (!data.装备栏 || typeof data.装备栏 !== 'object') {
        data.装备栏 = { 装备1: null, 装备2: null, 装备3: null, 装备4: null, 装备5: null, 装备6: null }
      }

      if (!Array.isArray((data as any).掌握技能)) (data as any).掌握技能 = []
      if ((data as any).修炼功法 === undefined) (data as any).修炼功法 = null

      if (!data.记忆 || typeof data.记忆 !== 'object') {
        data.记忆 = { 短期记忆: [], 中期记忆: [], 长期记忆: [], 隐式中期记忆: [] }
      }

      data.记忆.短期记忆 = Array.isArray(data.记忆.短期记忆) ? data.记忆.短期记忆 : []
      data.记忆.中期记忆 = Array.isArray(data.记忆.中期记忆) ? data.记忆.中期记忆 : []
      data.记忆.长期记忆 = Array.isArray(data.记忆.长期记忆) ? data.记忆.长期记忆 : []
      data.记忆.隐式中期记忆 = Array.isArray(data.记忆.隐式中期记忆) ? data.记忆.隐式中期记忆 : []

      if (!(data as any).自定义选项 || typeof (data as any).自定义选项 !== 'object') {
        ;(data as any).自定义选项 = {}
      }

      repairEquipmentAndCultivation(data)

      removePrivateInfo(data)

      return data
    },
    fromSaveData(data: SaveData) {
      if (!data.玩家角色状态 || !data.游戏时间 || !data.背包) {
        throw new Error('存档数据不完整')
      }
      const cloned = deepClone(data)

      // 兼容：补齐角色基础信息中常用字段（旧存档可能缺失）
      const base: any = ((cloned as any).角色基础信息 ||= {})
      if (base.性别 === undefined) base.性别 = '未知'
      if (base.种族 === undefined) base.种族 = '人族'
      if (base.世界 === undefined) base.世界 = ''
      if (base.天资 === undefined) base.天资 = ''
      if (base.出生 === undefined) base.出生 = ''
      // 兼容：部分模块/旧存档使用「出身」字段
      if (base.出身 === undefined && base.出生 !== undefined) base.出身 = base.出生
      if (base.出生 === undefined && base.出身 !== undefined) base.出生 = base.出身
      if (base.灵根 === undefined) base.灵根 = null
      if (!Array.isArray(base.天赋)) base.天赋 = []
      if (!base.先天六司 || typeof base.先天六司 !== 'object') {
        base.先天六司 = { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 }
      }
      if (!base.后天六司 || typeof base.后天六司 !== 'object') {
        base.后天六司 = { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 }
      }

      // 对齐结构：兼容 old save（无游戏状态）与 new save（有游戏状态）
      const gs: any = (cloned as any).游戏状态
      if (gs && typeof gs === 'object') {
        if (gs.游戏时间 && typeof gs.游戏时间 === 'object') {
          cloned.游戏时间 = gs.游戏时间
        } else {
          gs.游戏时间 = cloned.游戏时间
        }
        if (gs.宗门信息 !== undefined) {
          ;(cloned as any).宗门信息 = gs.宗门信息
        } else {
          gs.宗门信息 = (cloned as any).宗门信息 ?? null
        }
      } else {
        ;(cloned as any).游戏状态 = { 游戏时间: cloned.游戏时间, 宗门信息: (cloned as any).宗门信息 ?? null }
      }

      if (!cloned.装备栏 || typeof cloned.装备栏 !== 'object') {
        cloned.装备栏 = { 装备1: null, 装备2: null, 装备3: null, 装备4: null, 装备5: null, 装备6: null }
      } else {
        const eq: any = cloned.装备栏
        if (!('装备1' in eq)) eq.装备1 = null
        if (!('装备2' in eq)) eq.装备2 = null
        if (!('装备3' in eq)) eq.装备3 = null
        if (!('装备4' in eq)) eq.装备4 = null
        if (!('装备5' in eq)) eq.装备5 = null
        if (!('装备6' in eq)) eq.装备6 = null
      }

      ;(cloned as any).修炼功法 = (cloned as any).修炼功法 ?? null
      if (!Array.isArray((cloned as any).掌握技能)) (cloned as any).掌握技能 = []

      if (!cloned.玩家角色状态.境界 || typeof cloned.玩家角色状态.境界 !== 'object') {
        cloned.玩家角色状态.境界 = { 名称: '凡人', 阶段: '初期', 当前进度: 0, 下一级所需: 100, 突破描述: '' }
      }

      if (!cloned.玩家角色状态.气血) cloned.玩家角色状态.气血 = { 当前: 100, 上限: 100 }
      if (!cloned.玩家角色状态.灵气) cloned.玩家角色状态.灵气 = { 当前: 50, 上限: 50 }
      if (!cloned.玩家角色状态.神识) cloned.玩家角色状态.神识 = { 当前: 30, 上限: 30 }
      if (!cloned.玩家角色状态.寿命) cloned.玩家角色状态.寿命 = { 当前: 18, 上限: 80 }
      if (!Array.isArray(cloned.玩家角色状态.状态效果)) cloned.玩家角色状态.状态效果 = []

      const ps: any = cloned.玩家角色状态
      if (base.灵根 == null && ps?.灵根 !== undefined) base.灵根 = ps.灵根
      if (!base.出生 && ps?.出生 !== undefined) base.出生 = ps.出生
      if (base.出身 === undefined && base.出生 !== undefined) base.出身 = base.出生

      const wi: any = (cloned as any).世界信息
      if (wi && typeof wi === 'object' && Array.isArray(wi.大陆信息)) {
        for (const c of wi.大陆信息 as any[]) {
          if (!c || typeof c !== 'object') continue
          if (c.bounds && typeof c.bounds === 'object') continue
          const pts: any[] = Array.isArray(c.大洲边界) ? c.大洲边界 : Array.isArray(c.continent_bounds) ? c.continent_bounds : []
          if (!Array.isArray(pts) || pts.length === 0) continue

          let minX = Infinity
          let minY = Infinity
          let maxX = -Infinity
          let maxY = -Infinity

          for (const p of pts) {
            let x = NaN
            let y = NaN
            if (p && typeof p === 'object') {
              x = Number((p as any)?.x ?? (p as any)?.[0])
              y = Number((p as any)?.y ?? (p as any)?.[1])
            } else if (typeof p === 'string') {
              const m = p.trim().match(/^\s*([+\-]?\d+(?:\.\d+)?)\s*[,\s]\s*([+\-]?\d+(?:\.\d+)?)\s*$/)
              if (m) {
                x = Number(m[1])
                y = Number(m[2])
              }
            }
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
          }

          if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
            c.bounds = { minX, minY, maxX, maxY }
          }
        }
      }

      if (!cloned.背包 || typeof cloned.背包 !== 'object') {
        ;(cloned as any).背包 = { 灵石: { 下品: 0, 中品: 0, 上品: 0, 极品: 0 }, 物品: {} }
      } else {
        const bag: any = cloned.背包
        if (!bag.灵石 || typeof bag.灵石 !== 'object') bag.灵石 = { 下品: 0, 中品: 0, 上品: 0, 极品: 0 }
        const stones: any = bag.灵石
        if (typeof stones.下品 !== 'number') stones.下品 = Number(stones.下品) || 0
        if (typeof stones.中品 !== 'number') stones.中品 = Number(stones.中品) || 0
        if (typeof stones.上品 !== 'number') stones.上品 = Number(stones.上品) || 0
        if (typeof stones.极品 !== 'number') stones.极品 = Number(stones.极品) || 0
        if (!bag.物品 || typeof bag.物品 !== 'object') bag.物品 = {}

        const items: Record<string, any> = bag.物品
        for (const [itemId, raw] of Object.entries(items)) {
          if (!raw || typeof raw !== 'object') {
            delete items[itemId]
            continue
          }

          const it: any = raw
          if (it.物品ID == null || it.物品ID === '') it.物品ID = itemId

          const t = String(it.类型 || '')
          it.类型 = t === '装备' || t === '功法' ? t : '其他'

          let q = it.品质
          if (!q || typeof q !== 'object') {
            q = { quality: '凡', grade: 1 }
            it.品质 = q
          }

          const qq = String(q.quality || '')
          if (qq === '凡品') q.quality = '凡'
          else if (qq === '黄品') q.quality = '黄'
          else if (qq === '玄品') q.quality = '玄'
          else if (qq === '地品') q.quality = '地'
          else if (qq === '天品') q.quality = '天'
          else if (qq === '仙品') q.quality = '仙'
          else if (qq === '神品') q.quality = '神'

          if (!['凡', '黄', '玄', '地', '天', '仙', '神'].includes(String(q.quality))) q.quality = '凡'
          const g = Number(q.grade)
          q.grade = Number.isFinite(g) && g >= 0 && g <= 10 ? Math.floor(g) : 1

          if (it.数量 !== undefined) {
            const n = Math.floor(Number(it.数量) || 0)
            it.数量 = Math.max(0, n)
          }
        }
      }

      const dao: any = (cloned as any).三千大道
      if (!dao || typeof dao !== 'object') {
        ;(cloned as any).三千大道 = { 大道列表: {}, 当前主修: null }
      } else {
        if (!dao.大道列表 || typeof dao.大道列表 !== 'object') dao.大道列表 = {}
        if (dao.当前主修 === undefined) dao.当前主修 = null
      }

      if (!(cloned as any).人物关系 || typeof (cloned as any).人物关系 !== 'object') {
        ;(cloned as any).人物关系 = {}
      }

      removePrivateInfo(cloned as any)

      if (!Array.isArray(cloned.叙事历史)) cloned.叙事历史 = []

      if (Array.isArray(cloned.叙事历史)) {
        cloned.叙事历史 = (cloned.叙事历史 as any[])
          .map((n: any) => {
            if (!n || typeof n !== 'object') return null
            const roleRaw = String(n.role || '').toLowerCase()
            const role = (roleRaw === 'user' ? 'user' : 'assistant') as 'user' | 'assistant'
            const text =
              typeof (n as any).text === 'string'
                ? String((n as any).text)
                : typeof (n as any).content === 'string'
                  ? String((n as any).content)
                  : typeof (n as any).message === 'string'
                    ? String((n as any).message)
                    : ''
            const createdAt = typeof (n as any).createdAt === 'string' ? String((n as any).createdAt) : new Date().toISOString()
            const stateChanges = Array.isArray((n as any).stateChanges)
              ? ((n as any).stateChanges as any[])
              : Array.isArray((n as any).state_changes)
                ? ((n as any).state_changes as any[])
                : undefined
            return { role, text, createdAt, stateChanges } as any
          })
          .filter(Boolean) as any
      }

      if (!cloned.记忆 || typeof cloned.记忆 !== 'object') {
        cloned.记忆 = { 短期记忆: [], 中期记忆: [], 长期记忆: [], 隐式中期记忆: [] }
      }
      cloned.记忆.短期记忆 = Array.isArray(cloned.记忆.短期记忆) ? cloned.记忆.短期记忆 : []
      cloned.记忆.中期记忆 = Array.isArray(cloned.记忆.中期记忆) ? cloned.记忆.中期记忆 : []
      cloned.记忆.长期记忆 = Array.isArray(cloned.记忆.长期记忆) ? cloned.记忆.长期记忆 : []
      cloned.记忆.隐式中期记忆 = Array.isArray(cloned.记忆.隐式中期记忆) ? cloned.记忆.隐式中期记忆 : []

      const qs: any = (cloned as any).任务系统
      if (!qs || typeof qs !== 'object') {
        ;(cloned as any).任务系统 = {
          当前任务列表: [],
          任务统计: { 完成总数: 0, 各类型完成: {} },
          配置: {
            启用系统任务: true,
            系统任务类型: ['宗门', '奇遇', '日常', '修为提升', '收集资源', '战斗挑战'],
            默认任务数量: 3,
            自动刷新: true,
            系统任务提示词: ''
          }
        }
      } else {
        if (!Array.isArray(qs.当前任务列表)) qs.当前任务列表 = []
        if (!qs.任务统计 || typeof qs.任务统计 !== 'object') qs.任务统计 = { 完成总数: 0, 各类型完成: {} }
        if (typeof qs.任务统计.完成总数 !== 'number') qs.任务统计.完成总数 = Number(qs.任务统计.完成总数) || 0
        if (!qs.任务统计.各类型完成 || typeof qs.任务统计.各类型完成 !== 'object') qs.任务统计.各类型完成 = {}
        if (!qs.配置 || typeof qs.配置 !== 'object') qs.配置 = {}
        if (qs.配置.启用系统任务 === undefined) qs.配置.启用系统任务 = true
        if (qs.配置.系统任务类型 === undefined) qs.配置.系统任务类型 = ['宗门', '奇遇', '日常', '修为提升', '收集资源', '战斗挑战']
        if (qs.配置.默认任务数量 === undefined) qs.配置.默认任务数量 = 3
        if (qs.配置.自动刷新 === undefined) qs.配置.自动刷新 = true
        if (qs.配置.系统任务提示词 === undefined) qs.配置.系统任务提示词 = ''
      }

      if (!(cloned as any).自定义选项 || typeof (cloned as any).自定义选项 !== 'object') {
        ;(cloned as any).自定义选项 = {}
      }

      if (!(cloned as any).系统 || typeof (cloned as any).系统 !== 'object') {
        ;(cloned as any).系统 = { nsfwMode: false, nsfwGenderFilter: '' }
      } else {
        const sys: any = (cloned as any).系统
        sys.nsfwMode = false
        sys.nsfwGenderFilter = ''
      }

      if ((cloned as any).身体部位开发 === undefined) {
        ;(cloned as any).身体部位开发 = {}
      } else {
        ;(cloned as any).身体部位开发 = {}
      }

      this.$state = cloned
      normalizeGameTime(this.游戏时间)
      if ((this as any).游戏状态?.游戏时间) normalizeGameTime((this as any).游戏状态.游戏时间)
      normalizeAgeAndLifespan(this.$state)
      checkAndMarkDeath(this.$state)
      cleanExpiredEffects(this.$state)
    }
  }
})
