export type TavernCommandAction = 'set' | 'add' | 'push' | 'pull' | 'delete'

export type TavernCommand = {
  action: TavernCommandAction
  key: string
  value: any
}

type PathSegment = string | number

function parsePath(path: string): PathSegment[] {
  const out: PathSegment[] = []
  const parts = String(path || '').split('.')
  for (const part of parts) {
    if (!part) continue
    const re = /([^\[\]]+)|(\[(\d+)\])/g
    let m: RegExpExecArray | null
    while ((m = re.exec(part))) {
      if (m[1]) out.push(m[1])
      else if (m[3]) out.push(Number(m[3]))
    }
  }
  return out
}

function ensureContainer(parent: any, seg: PathSegment, next: PathSegment | undefined) {
  if (typeof seg === 'number') {
    if (!Array.isArray(parent)) {
      return null
    }
    if (parent[seg] === undefined) {
      parent[seg] = typeof next === 'number' ? [] : {}
    }
    return parent[seg]
  }

  if (parent[seg] === undefined || parent[seg] === null) {
    parent[seg] = typeof next === 'number' ? [] : {}
  }
  return parent[seg]
}

function getParentAndKey(root: any, path: string): { parent: any; key: PathSegment } | null {
  const segs = parsePath(path)
  if (segs.length === 0) return null

  let cur = root
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]
    const next = segs[i + 1]
    const nextContainer = ensureContainer(cur, seg, next)
    if (nextContainer === null) return null
    cur = nextContainer
  }

  return { parent: cur, key: segs[segs.length - 1] }
}

function getValueByPath(obj: any, path: string): any {
  const segs = parsePath(path)
  let cur = obj
  for (const seg of segs) {
    if (cur == null) return undefined
    cur = cur[seg]
  }
  return cur
}

function setValueByPath(obj: any, path: string, value: any): void {
  const resolved = getParentAndKey(obj, path)
  if (!resolved) return
  const { parent, key } = resolved
  parent[key] = value
}

function enforceStatLimits(target: any, key: string): void {
  const limitMap: Record<string, string> = {
    '玩家角色状态.气血.当前': '玩家角色状态.气血.上限',
    '玩家角色状态.灵气.当前': '玩家角色状态.灵气.上限',
    '玩家角色状态.神识.当前': '玩家角色状态.神识.上限',
    '玩家角色状态.寿命.当前': '玩家角色状态.寿命.上限'
  }
  
  const limitKey = limitMap[key]
  if (limitKey) {
    const current = getValueByPath(target, key)
    const limit = getValueByPath(target, limitKey)
    if (typeof current === 'number' && typeof limit === 'number' && current > limit) {
      setValueByPath(target, key, limit)
      console.warn(`[AI双向系统] ${key} 超过上限 (${current} > ${limit})，已限制为 ${limit}`)
    }
  }
}

function isPrivateInfoPath(key: string) {
  const k = String(key || '')
  if (!k) return false
  if (k === '身体部位开发' || k.startsWith('身体部位开发.') || k.startsWith('身体部位开发[')) return true
  if (k.includes('.私密信息') || k.endsWith('.私密信息')) return true
  if (k === '系统.nsfwMode' || k.startsWith('系统.nsfwMode.') || k.startsWith('系统.nsfwMode[')) return true
  if (k === '系统.nsfwGenderFilter' || k.startsWith('系统.nsfwGenderFilter.') || k.startsWith('系统.nsfwGenderFilter[')) return true
  return false
}

function sanitizeObjectForPrivacy(key: string, value: any) {
  const k = String(key || '')
  if (!value || typeof value !== 'object') return value

  // 系统设置：强制关闭
  if (k === '系统') {
    const sys: any = value
    sys.nsfwMode = false
    if (sys.nsfwGenderFilter !== undefined) sys.nsfwGenderFilter = ''
    return value
  }

  // NPC对象：移除私密信息
  if (/^人物关系\.[^.]+$/.test(k)) {
    const npc: any = value
    if (npc.私密信息 !== undefined) delete npc.私密信息
    return value
  }

  return value
}

export function applyTavernCommands(target: any, commands: TavernCommand[]) {
  if (!Array.isArray(commands)) throw new Error('tavern_commands不是数组')
  if (commands.length === 0) throw new Error('tavern_commands为空')

  for (const cmd of commands) {
    if (!cmd || typeof cmd !== 'object') continue
    const action = cmd.action
    const key = String(cmd.key || '')
    if (!key) continue

    if (isPrivateInfoPath(key)) {
      continue
    }

    // 叙事历史由前端维护：禁止AI使用 set 覆盖历史（否则会导致对话只剩最新一条/缺失用户输入）
    if (action === 'set' && (key === '叙事历史' || key.startsWith('叙事历史[') || key.startsWith('叙事历史.'))) {
      console.warn(`[AI双向系统] 阻止AI使用 set 覆盖叙事历史：${key}`)
      continue
    }

    const resolved = getParentAndKey(target, key)
    if (!resolved) continue
    const { parent, key: lastKey } = resolved

    if (action === 'set') {
      cmd.value = sanitizeObjectForPrivacy(key, cmd.value)
      if (key.startsWith('背包.物品.') && cmd.value && typeof cmd.value === 'object') {
        const v: any = cmd.value
        const k = typeof lastKey === 'string' ? lastKey : ''
        if (k && (v.物品ID == null || v.物品ID === '')) v.物品ID = k

        const t = String(v.类型 || '')
        v.类型 = t === '装备' || t === '功法' ? t : '其他'

        let q = v.品质
        if (!q || typeof q !== 'object') {
          q = { quality: '凡', grade: 1 }
          v.品质 = q
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
      }

      // 数组字段保护（原版逻辑）
      const arrayFields = [
        '玩家角色状态.状态效果',
        '任务系统.当前任务列表',
        '任务列表',
        '物品栏.物品',
        '技能列表',
        '记忆.短期记忆',
        '记忆.中期记忆',
        '记忆.长期记忆',
        '叙事历史'
      ]
      const isArrayField = arrayFields.some(f => key === f || (key.startsWith(f + '[') && !key.includes('.', f.length)))
      
      if (isArrayField) {
        if (cmd.value == null) {
          console.warn(`[AI双向系统] 阻止将数组字段 ${key} 设为 null/undefined，改为空数组`)
          if (typeof lastKey === 'number') {
            if (Array.isArray(parent)) parent[lastKey] = []
          } else {
            parent[lastKey] = []
          }
          continue
        }
        if (!Array.isArray(cmd.value)) {
          console.warn(`[AI双向系统] 阻止将数组字段 ${key} 设为非数组值，保持原值`)
          continue
        }
      }
      
      if (typeof lastKey === 'number') {
        if (!Array.isArray(parent)) continue
        parent[lastKey] = cmd.value
      } else {
        parent[lastKey] = cmd.value
      }
      enforceStatLimits(target, key)
      continue
    }

    if (action === 'add') {
      const delta = Number(cmd.value)
      if (!Number.isFinite(delta)) continue
      const prev = typeof lastKey === 'number' ? parent?.[lastKey] : parent?.[lastKey]
      const base = typeof prev === 'number' && Number.isFinite(prev) ? prev : 0
      let newValue = base + delta
      
      // 灵石不能为负数
      if (key.includes('灵石') && newValue < 0) {
        console.warn(`[AI双向系统] ${key} 执行add后会变成负数 (${base} + ${delta} = ${newValue})，已限制为0`)
        newValue = 0
      }
      
      if (typeof lastKey === 'number') {
        if (!Array.isArray(parent)) continue
        parent[lastKey] = newValue
      } else {
        parent[lastKey] = newValue
      }
      enforceStatLimits(target, key)
      continue
    }

    if (action === 'push') {
      const prev = typeof lastKey === 'number' ? parent?.[lastKey] : parent?.[lastKey]
      if (Array.isArray(prev)) {
        prev.push(cmd.value)
      } else {
        const arr = [] as any[]
        arr.push(cmd.value)
        if (typeof lastKey === 'number') {
          if (!Array.isArray(parent)) continue
          parent[lastKey] = arr
        } else {
          parent[lastKey] = arr
        }
      }
      continue
    }

    if (action === 'pull') {
      const prev = typeof lastKey === 'number' ? parent?.[lastKey] : parent?.[lastKey]
      if (Array.isArray(prev)) {
        const target = cmd.value
        const eq = (a: any, b: any) => {
          if (a === b) return true
          try {
            return JSON.stringify(a) === JSON.stringify(b)
          } catch {
            return false
          }
        }
        for (let i = prev.length - 1; i >= 0; i--) {
          if (eq(prev[i], target)) prev.splice(i, 1)
        }
      }
      continue
    }

    if (action === 'delete') {
      if (typeof lastKey === 'number') {
        if (!Array.isArray(parent)) continue
        parent.splice(lastKey, 1)
      } else {
        delete parent[lastKey]
      }
    }
  }
}

export type GameTime = { 年: number; 月: number; 日: number; 小时: number; 分钟: number }

export function normalizeGameTime(time: GameTime) {
  if (!time) return

  if (!Number.isFinite(time.分钟)) time.分钟 = 0
  if (!Number.isFinite(time.小时)) time.小时 = 0
  if (!Number.isFinite(time.日)) time.日 = 1
  if (!Number.isFinite(time.月)) time.月 = 1
  if (!Number.isFinite(time.年)) time.年 = 1000

  if (time.分钟 >= 60) {
    time.小时 += Math.floor(time.分钟 / 60)
    time.分钟 = time.分钟 % 60
  }

  if (time.分钟 < 0) {
    const borrow = Math.ceil(Math.abs(time.分钟) / 60)
    time.小时 -= borrow
    time.分钟 += borrow * 60
  }

  if (time.小时 >= 24) {
    time.日 += Math.floor(time.小时 / 24)
    time.小时 = time.小时 % 24
  }

  if (time.小时 < 0) {
    const borrow = Math.ceil(Math.abs(time.小时) / 24)
    time.日 -= borrow
    time.小时 += borrow * 24
  }

  while (time.日 > 30) {
    time.月 += Math.floor((time.日 - 1) / 30)
    time.日 = ((time.日 - 1) % 30) + 1
  }

  while (time.日 <= 0) {
    time.月 -= 1
    time.日 += 30
  }

  while (time.月 > 12) {
    time.年 += Math.floor((time.月 - 1) / 12)
    time.月 = ((time.月 - 1) % 12) + 1
  }

  while (time.月 <= 0) {
    time.年 -= 1
    time.月 += 12
  }
}

function gameTimeToMinutes(t: GameTime) {
  return (((t.年 * 12 + (t.月 - 1)) * 30 + (t.日 - 1)) * 24 + t.小时) * 60 + t.分钟
}

export function cleanExpiredEffects(state: any) {
  const effects = state?.玩家角色状态?.状态效果
  const t = state?.游戏时间
  if (!Array.isArray(effects) || !t) return

  const now = gameTimeToMinutes(t)
  const next = effects.filter((e: any) => {
    const duration = Number(e?.持续时间分钟)
    if (duration === 99999) return true
    if (!Number.isFinite(duration) || duration <= 0) return false

    const gen = e?.生成时间
    if (!gen || typeof gen !== 'object') return false

    const genTime: GameTime = {
      年: Number(gen.年) || 0,
      月: Number(gen.月) || 1,
      日: Number(gen.日) || 1,
      小时: Number(gen.小时) || 0,
      分钟: Number(gen.分钟) || 0
    }

    const end = gameTimeToMinutes(genTime) + duration
    return now <= end
  })

  state.玩家角色状态.状态效果 = next
}
