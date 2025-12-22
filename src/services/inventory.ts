import type { TavernCommand } from './tavernCommands'

export type ItemQuality = {
  quality: '凡' | '黄' | '玄' | '地' | '天' | '仙' | '神' | string
  grade: number
}

export type InventoryItemBase = {
  物品ID: string
  名称: string
  类型: '装备' | '功法' | '丹药' | '材料' | '其他' | string
  品质?: ItemQuality
  数量?: number
  描述?: string
}

export type EquipmentSlotKey = `装备${1 | 2 | 3 | 4 | 5 | 6}`

export type EquipmentSlotRef = { 物品ID: string; 名称: string } | null

export const EQUIPMENT_SLOTS: EquipmentSlotKey[] = ['装备1', '装备2', '装备3', '装备4', '装备5', '装备6']

export function normalizeItemQuantity(item: any): number {
  const v = item?.数量 ?? item?.count
  let n = 1
  if (typeof v === 'number' && Number.isFinite(v)) n = v
  else if (typeof v === 'string') {
    const parsed = Number(v)
    if (Number.isFinite(parsed)) n = parsed
  }
  return Math.max(0, Math.floor(n))
}

export function qualityLabel(q?: ItemQuality): { top: string; sub: string } {
  const top = q?.quality ? String(q.quality) : '凡'
  const grade = typeof q?.grade === 'number' && Number.isFinite(q.grade) ? Math.floor(q.grade) : 1

  let tier = '下品'
  if (grade <= 0) tier = '残缺'
  else if (grade <= 3) tier = '下品'
  else if (grade <= 6) tier = '中品'
  else if (grade <= 9) tier = '上品'
  else tier = '极品'

  const sub = `${tier}(${Math.max(0, grade)})`
  return { top, sub }
}

export function firstEmptyEquipmentSlot(equipment: any): EquipmentSlotKey | null {
  for (const k of EQUIPMENT_SLOTS) {
    const v = equipment?.[k]
    if (!v) return k
  }
  return null
}

export function findEquipmentSlotByItemId(equipment: any, itemId: string): EquipmentSlotKey | null {
  for (const k of EQUIPMENT_SLOTS) {
    const v = equipment?.[k]
    const id = v && typeof v === 'object' ? (v as any).物品ID : null
    if (id === itemId) return k
  }
  return null
}

export function setPath(key: string, value: any): TavernCommand {
  return { action: 'set', key, value }
}

export function addPath(key: string, value: number): TavernCommand {
  return { action: 'add', key, value }
}

export function pushPath(key: string, value: any): TavernCommand {
  return { action: 'push', key, value }
}

export function delPath(key: string): TavernCommand {
  return { action: 'delete', key, value: null }
}

export function buildUseItemCommands(itemId: string, count: number, prevQuantity: number): TavernCommand[] {
  const n = Math.max(1, Math.floor(count))
  if (prevQuantity <= n) {
    return [delPath(`背包.物品.${itemId}`)]
  }
  return [addPath(`背包.物品.${itemId}.数量`, -n)]
}

type StatKey = '气血' | '灵气' | '神识' | '寿命'

function getStatBar(state: any, key: StatKey): { 当前: number; 上限: number } {
  const bar = state?.玩家角色状态?.[key]
  const cur = Number(bar?.当前)
  const max = Number(bar?.上限)
  return {
    当前: Number.isFinite(cur) ? cur : 0,
    上限: Number.isFinite(max) ? max : 0
  }
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function buildClampSetCommands(state: any, key: StatKey, delta: number): TavernCommand[] {
  const bar = getStatBar(state, key)
  const next = clamp(bar.当前 + delta, 0, Math.max(0, bar.上限))
  return [setPath(`玩家角色状态.${key}.当前`, next)]
}

function parseHealAmount(text: string, max: number): number {
  const m = text.match(/([+\-]?\d+)\s*(点)?/)
  if (m && m[1]) {
    const n = Number(m[1])
    if (Number.isFinite(n)) return n
  }

  if (text.includes('少量')) return Math.max(5, Math.floor(max * 0.1))
  if (text.includes('中量')) return Math.max(10, Math.floor(max * 0.3))
  if (text.includes('大量')) return Math.max(20, Math.floor(max * 0.6))
  return Math.max(1, Math.floor(max * 0.05))
}

function parseUseEffects(item: any, state: any, count: number): { statDeltas: Partial<Record<StatKey, number>>; statusEffects: any[] } {
  const n = Math.max(1, Math.floor(count))
  const statDeltas: Partial<Record<StatKey, number>> = {}
  const statusEffects: any[] = []

  const effectText = String((item?.使用效果 || item?.描述 || '') as any)

  const structured = item?.效果
  if (structured && typeof structured === 'object') {
    for (const k of ['气血', '灵气', '神识', '寿命'] as StatKey[]) {
      const v = Number((structured as any)[k])
      if (Number.isFinite(v) && v !== 0) statDeltas[k] = (statDeltas[k] || 0) + v * n
    }
    const se = (structured as any).状态效果
    if (Array.isArray(se)) statusEffects.push(...se)
    else if (se && typeof se === 'object') statusEffects.push(se)
  }

  const directEffects = item?.状态效果
  if (Array.isArray(directEffects)) statusEffects.push(...directEffects)
  else if (directEffects && typeof directEffects === 'object') statusEffects.push(directEffects)

  const bars: Record<StatKey, { 当前: number; 上限: number }> = {
    气血: getStatBar(state, '气血'),
    灵气: getStatBar(state, '灵气'),
    神识: getStatBar(state, '神识'),
    寿命: getStatBar(state, '寿命')
  }

  const patterns: Array<{ key: StatKey; re: RegExp; word: string }> = [
    { key: '气血', re: /(恢复|回复|补充|增加)([^。\n]*)气血([^。\n]*)/g, word: '气血' },
    { key: '灵气', re: /(恢复|回复|补充|增加)([^。\n]*)灵气([^。\n]*)/g, word: '灵气' },
    { key: '神识', re: /(恢复|回复|补充|增加)([^。\n]*)神识([^。\n]*)/g, word: '神识' },
    { key: '寿命', re: /(恢复|回复|补充|增加)([^。\n]*)寿命([^。\n]*)/g, word: '寿命' }
  ]

  for (const p of patterns) {
    let m: RegExpExecArray | null
    while ((m = p.re.exec(effectText))) {
      const chunk = `${m[0]}`
      const amount = parseHealAmount(chunk, bars[p.key].上限)
      statDeltas[p.key] = (statDeltas[p.key] || 0) + amount * n
    }
  }

  return { statDeltas, statusEffects }
}

export function buildUseItemCommandsWithEffects(item: any, count: number, state: any): TavernCommand[] {
  const itemId = String(item?.物品ID || '')
  if (!itemId) return []

  const prevQuantity = normalizeItemQuantity(item)
  const n = Math.max(1, Math.floor(count))
  if (prevQuantity < n) return []

  const cmds: TavernCommand[] = []
  cmds.push(...buildUseItemCommands(itemId, n, prevQuantity))

  const parsed = parseUseEffects(item, state, n)

  for (const key of ['气血', '灵气', '神识', '寿命'] as StatKey[]) {
    const d = Number((parsed.statDeltas as any)[key] || 0)
    if (!Number.isFinite(d) || d === 0) continue

    if (key === '寿命') {
      cmds.push(addPath('玩家角色状态.寿命.上限', d))
      continue
    }

    cmds.push(...buildClampSetCommands(state, key, d))
  }

  if (parsed.statusEffects.length > 0) {
    const t = state?.游戏时间
    const baseTime = t
      ? { 年: Number(t.年) || 0, 月: Number(t.月) || 1, 日: Number(t.日) || 1, 小时: Number(t.小时) || 0, 分钟: Number(t.分钟) || 0 }
      : { 年: 0, 月: 1, 日: 1, 小时: 0, 分钟: 0 }

    for (const raw of parsed.statusEffects) {
      if (!raw || typeof raw !== 'object') continue
      const effect = {
        状态名称: (raw as any).状态名称 || (raw as any).name || '未知状态',
        类型: (raw as any).类型 || (raw as any).type || 'buff',
        生成时间: (raw as any).生成时间 || baseTime,
        持续时间分钟: typeof (raw as any).持续时间分钟 === 'number' ? (raw as any).持续时间分钟 : 60,
        状态描述: (raw as any).状态描述 || (raw as any).description || '无描述',
        强度: (raw as any).强度 ?? (raw as any).intensity,
        来源: (raw as any).来源 || (raw as any).source || String(item?.名称 || '')
      }
      cmds.push(pushPath('玩家角色状态.状态效果', effect))
    }
  }

  return cmds
}

export function buildEquipCommands(item: any, slot: EquipmentSlotKey): TavernCommand[] {
  const itemId = String(item?.物品ID || '')
  const name = String(item?.名称 || itemId)
  const cmds: TavernCommand[] = [
    setPath(`装备栏.${slot}`, { 物品ID: itemId, 名称: name }),
    setPath(`背包.物品.${itemId}.已装备`, true)
  ]

  const bonus = item?.装备增幅
  if (bonus && typeof bonus === 'object') {
    if (typeof bonus.气血上限 === 'number' && Number.isFinite(bonus.气血上限)) cmds.push(addPath('玩家角色状态.气血.上限', bonus.气血上限))
    if (typeof bonus.灵气上限 === 'number' && Number.isFinite(bonus.灵气上限)) cmds.push(addPath('玩家角色状态.灵气.上限', bonus.灵气上限))
    if (typeof bonus.神识上限 === 'number' && Number.isFinite(bonus.神识上限)) cmds.push(addPath('玩家角色状态.神识.上限', bonus.神识上限))

    const six = bonus.后天六司
    if (six && typeof six === 'object') {
      for (const k of ['根骨', '灵性', '悟性', '气运', '魅力', '心性']) {
        const d = Number((six as any)[k])
        if (Number.isFinite(d) && d !== 0) cmds.push(addPath(`角色基础信息.后天六司.${k}`, d))
      }
    }
  }

  return cmds
}

export function buildEquipGongfaCommands(item: any, allItems: Record<string, any>): TavernCommand[] {
  const itemId = String(item?.物品ID || '')
  const name = String(item?.名称 || itemId)
  const cmds: TavernCommand[] = []

  for (const [k, v] of Object.entries(allItems || {})) {
    if (String((v as any)?.类型) === '功法') {
      cmds.push(setPath(`背包.物品.${k}.已装备`, k === itemId))
      cmds.push(setPath(`背包.物品.${k}.修炼中`, k === itemId))
    }
  }

  cmds.push(setPath('修炼功法', { 物品ID: itemId, 名称: name }))
  cmds.push(setPath('掌握技能', rebuildMasteredSkillsFromCultivationItem(item)))
  return cmds
}

export function buildUnequipGongfaCommands(item: any): TavernCommand[] {
  const itemId = String(item?.物品ID || '')
  return [setPath(`背包.物品.${itemId}.已装备`, false), setPath(`背包.物品.${itemId}.修炼中`, false), setPath('修炼功法', null), setPath('掌握技能', [])]
}

export function buildCultivateGongfaCommands(item: any, delta: number): TavernCommand[] {
  const itemId = String(item?.物品ID || '')
  const prev = typeof item?.修炼进度 === 'number' && Number.isFinite(item.修炼进度) ? item.修炼进度 : 0
  const next = Math.min(100, Math.max(0, prev + (Number.isFinite(delta) ? delta : 0)))

  const cmds: TavernCommand[] = [setPath(`背包.物品.${itemId}.修炼进度`, next)]

  const skills = Array.isArray(item?.功法技能) ? (item.功法技能 as any[]) : []
  const unlocked = Array.isArray(item?.已解锁技能) ? (item.已解锁技能 as any[]) : []
  const unlockedSet = new Set(unlocked.map(x => String(x)))

  for (const s of skills) {
    const sName = String(s?.技能名称 || s?.名称 || '').trim()
    if (!sName) continue
    const req = Number(s?.熟练度要求)
    const need = Number.isFinite(req) ? req : 0
    if (next >= need && !unlockedSet.has(sName)) {
      unlockedSet.add(sName)
      cmds.push(pushPath(`背包.物品.${itemId}.已解锁技能`, sName))
    }
  }

  const rebuiltItem = {
    ...item,
    修炼进度: next,
    已解锁技能: Array.from(unlockedSet)
  }
  cmds.push(setPath('掌握技能', rebuildMasteredSkillsFromCultivationItem(rebuiltItem)))

  return cmds
}

export function buildUnequipCommands(item: any, slot: EquipmentSlotKey): TavernCommand[] {
  const itemId = String(item?.物品ID || '')
  const cmds: TavernCommand[] = [setPath(`装备栏.${slot}`, null), setPath(`背包.物品.${itemId}.已装备`, false)]

  const bonus = item?.装备增幅
  if (bonus && typeof bonus === 'object') {
    if (typeof bonus.气血上限 === 'number' && Number.isFinite(bonus.气血上限)) cmds.push(addPath('玩家角色状态.气血.上限', -bonus.气血上限))
    if (typeof bonus.灵气上限 === 'number' && Number.isFinite(bonus.灵气上限)) cmds.push(addPath('玩家角色状态.灵气.上限', -bonus.灵气上限))
    if (typeof bonus.神识上限 === 'number' && Number.isFinite(bonus.神识上限)) cmds.push(addPath('玩家角色状态.神识.上限', -bonus.神识上限))

    const six = bonus.后天六司
    if (six && typeof six === 'object') {
      for (const k of ['根骨', '灵性', '悟性', '气运', '魅力', '心性']) {
        const d = Number((six as any)[k])
        if (Number.isFinite(d) && d !== 0) cmds.push(addPath(`角色基础信息.后天六司.${k}`, -d))
      }
    }
  }

  return cmds
}

export function rebuildMasteredSkillsFromCultivationItem(item: any): any[] {
  const unlocked = item?.已解锁技能
  const skills = item?.功法技能

  if (!Array.isArray(unlocked) || !Array.isArray(skills)) return []

  const entries: any[] = []
  for (const name of unlocked) {
    const s = skills.find((x: any) => String(x?.技能名称 || x?.名称 || '') === String(name))
    const title = String(s?.技能名称 || s?.名称 || name)
    const desc = String(s?.技能描述 || s?.描述 || '')
    const consume = String(s?.消耗 || '')

    entries.push({
      技能名称: title,
      技能描述: desc,
      来源: String(item?.名称 || ''),
      消耗: consume,
      熟练度: Number(item?.修炼进度 ?? 0) || 0,
      使用次数: 0
    })
  }

  return entries
}
