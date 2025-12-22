import { chatCompletionText } from './aiClient'
import { promptStore } from './promptStore'
import promptsAll from '../../prompts_all (1).json'
import tipsPromptRaw from '../../提示词.txt?raw'

export type WorldGenerationProvider = 'local' | 'custom_api' | 'openai_compat'

type LocationInfo = {
  名称: string
  类型: string
  位置?: string
  coordinates?: { x: number; y: number }
  描述: string
  特色?: string[]
  安全等级?: string
  开放状态?: string
  相关势力?: string[]
  特殊功能?: string[]
}

type FactionInfo = {
  名称: string
  类型: string
  等级: string
  位置: string
  势力范围?: string[]
  描述: string
  特色?: string[]
  与玩家关系?: string
  声望值?: number
  敌意值?: number
  所在大洲?: string
  主要资源?: string[]
  综合实力?: number
  领导层?: Record<string, any>
  成员数量?: Record<string, any>
  境界分布?: Record<string, any>
  职位分布?: Record<string, any>
  leadership?: Record<string, any>
  memberCount?: Record<string, any>
  territoryInfo?: Record<string, any>
  canJoin?: boolean
  joinRequirements?: string[]
  benefits?: string[]
}

type ContinentInfo = {
  名称: string
  描述: string
  地理特征?: string[]
  修真环境?: string
  气候?: string
  天然屏障?: string[]
  大洲边界?: { x: number; y: number }[]
  bounds?: { minX: number; minY: number; maxX: number; maxY: number }
}

export type WorldInfo = {
  世界名称: string
  世界背景: string
  世界纪元: string
  地图?: { continents: ContinentInfo[]; factions: FactionInfo[]; features: any[] }
  大陆信息: ContinentInfo[]
  势力信息: FactionInfo[]
  地点信息: LocationInfo[]
  地图配置?: Record<string, any>
  特殊设定?: any[]
  生成时间: string
  版本: string
}

export type WorldGenerationInput = {
  worldName: string
  worldEra: string
  worldBackground: string
  characterName: string
  characterBackground: string
  seed?: number
  mapConfig?: Record<string, any>
  counts?: {
    continentCount?: number
    factionCount?: number
    locationCount?: number
    secretRealmsCount?: number
  }
}

function stripThinkingText(text: string) {
  if (!text) return ''
  return String(text)
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
}

function sanitizeJsonTextForParsing(raw: string) {
  let s = String(raw || '')
  s = s.replace(/^\uFEFF/, '')
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
  let out = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (!escaped && ch === '"') {
        inString = false
        out += ch
        continue
      }
      if (!escaped && (ch === '\n' || ch === '\r')) {
        out += '\\n'
        continue
      }
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      }
      out += ch
      continue
    }

    if (ch === '"') {
      inString = true
      out += ch
      continue
    }

    if (ch === '：') {
      out += ':'
      continue
    }
    if (ch === '，') {
      out += ','
      continue
    }

    out += ch
  }
  return out.trim()
}

function jsonParseLenient(raw: string) {
  const original = String(raw || '')
  const s = sanitizeJsonTextForParsing(original)
  try {
    return JSON.parse(s)
  } catch {
    try {
      const noTrailingComma = s.replace(/,\s*([}\]])/g, '$1')
      return JSON.parse(noTrailingComma)
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2)
      const posMatch = msg.match(/position\s+(\d+)/i)
      if (posMatch) {
        const pos = Number(posMatch[1])
        if (Number.isFinite(pos)) {
          const start = Math.max(0, pos - 200)
          const end = Math.min(s.length, pos + 200)
          const excerpt = s.slice(start, end)
          throw new Error(`${msg}\n\nJSON片段(失败位置附近)：\n${excerpt}`)
        }
      }
      throw e2
    }
  }
}

function generateWorldGenSessionId() {
  return Math.random().toString(36).substring(7)
}

function generateWorldGenSeed() {
  return Date.now() + Math.floor(1_000_000 * Math.random())
}

function computeWorldStyleGuidance(worldName: string, worldBackground: string) {
  const joined = `${worldName || ''} ${worldBackground || ''}`
  const isHonghuang = /洪荒|上古|巫妖|盘古|女娲|三皇五帝/.test(joined)
  const isEarth = /地球|现实|现代|都市|蓝星|人间/.test(joined)
  const isSciFi = /星际|太空|科幻|联邦|宇宙/.test(joined)
  const isXianxia = /仙侠|玄幻|修仙|道门|宗门/.test(joined)

  if (isHonghuang) {
    return (
      '## 世界风格适配指引\n' +
      '- 命名: 洪荒神话风格（不周山、瑶池圣地、巫族、妖庭）\n' +
      '- 灵气: 极高（先天灵气充沛）\n' +
      '- 境界: 可达仙人、圣人\n' +
      '- 地理: 九州四海式宏观板块，巨型自然断裂\n' +
      '- 势力: 天庭/地府/部族/圣地/妖族祖庭\n' +
      '- 地点: 神山、仙岛、天河、祖脉、上古战场\n'
    )
  }
  if (isEarth) {
    return (
      '## 世界风格适配指引\n' +
      '- 命名: 现代现实风格（龙虎山、武当派、国际异能者协会），严禁"XX宗"、"XX阁"\n' +
      '- 灵气: 极低（末法时代）\n' +
      '- 境界: 严格限制筑基期及以下，禁止金丹期以上\n' +
      '- 地理: 抽象化现实大洲，结界/秘境连接\n' +
      '- 势力: 隐世门派、古老世家、修行者协会\n' +
      '- 地点: 隐秘道场、古迹遗址、地下遗迹\n' +
      '- 隐蔽性: 所有超凡力量高度隐蔽\n'
    )
  }
  if (isSciFi) {
    return (
      '## 世界风格适配指引\n' +
      '- 命名: 科幻风格（星际联邦、银河帝国、火种公司）\n' +
      '- 灵气: 可变（高灵能星球/科技星球）\n' +
      '- 境界: 基因锁、灵能等级体系\n' +
      '- 地理: 多星系板块，扇区/环带/引力井\n' +
      '- 势力: 联邦/星盟/舰队修会\n' +
      '- 地点: 母港、环轨道城、星门、遗迹舰坟\n'
    )
  }
  if (isXianxia) {
    return (
      '## 世界风格适配指引\n' +
      '- 命名: 传统仙侠（青云门、天机阁、蜀山剑派）\n' +
      '- 灵气: 中到高\n' +
      '- 境界: 可达渡劫期、大乘期\n' +
      '- 地理: 传统仙侠大陆，灵脉走向决定边界\n' +
      '- 势力: 宗门/世家/魔道/商会/散修联盟\n' +
      '- 地点: 山门、坊市、炼丹谷、秘境、洞天福地\n'
    )
  }
  return (
    '## 世界风格适配指引\n' +
    '- 命名: 保持多样性，紧密关联世界背景\n' +
    '- 灵气: 中等\n' +
    '- 境界: 默认渡劫期\n' +
    '- 风格: 根据背景自由发挥\n'
  )
}

function patchWorldGenPromptLikeOriginal(basePrompt: string, input: WorldGenerationInput) {
  let out = String(basePrompt || '')

  const continentCount = input.counts?.continentCount ?? 3
  const factionCount = input.counts?.factionCount ?? 5
  const locationCount = input.counts?.locationCount ?? 10
  const secretRealmsCount = Math.min(locationCount, Math.max(0, input.counts?.secretRealmsCount ?? Math.min(5, locationCount)))

  const sessionId = generateWorldGenSessionId()
  const seed = generateWorldGenSeed()
  out = out.replace(/会话ID:\s*[^\n|]+\s*\|\s*随机种子:\s*\d+/g, `会话ID: ${sessionId} | 随机种子: ${seed}`)
  const injectLines: string[] = []
  if (input.characterBackground) injectLines.push(`角色出身: ${input.characterBackground}`)
  if (input.worldBackground) injectLines.push(`世界背景: ${input.worldBackground}`)
  if (input.worldEra) injectLines.push(`世界时代: ${input.worldEra}`)
  if (input.worldName) injectLines.push(`世界名称: ${input.worldName}`)
  if (injectLines.length) {
    out = out.replace(/## 命名规则\s*\n/g, `## 命名规则\n\n${injectLines.join('\n')}\n\n`)
  }
  const styleGuidance = computeWorldStyleGuidance(input.worldName, input.worldBackground)
  out = out.replace(/## 世界风格适配指引[\s\S]*?(?=\n\n\*\*禁用词根\*\*：)/g, styleGuidance.trimEnd())
  out = out
    .replace(/1\.\s*continents数组：\s*\d+个大洲（边界不重叠）/g, `1. continents数组：${continentCount}个大洲（边界不重叠）`)
    .replace(/2\.\s*factions数组：\s*\d+个势力（不能为空）/g, `2. factions数组：${factionCount}个势力（不能为空）`)
    .replace(/3\.\s*locations数组：\s*\d+个地点（不能为空）/g, `3. locations数组：${locationCount}个地点（不能为空）`)
    .replace(/## 大洲生成要求（\s*\d+\s*个）/g, `## 大洲生成要求（${continentCount}个）`)
  const rows = Math.ceil(Math.sqrt(continentCount))
  const cols = Math.ceil(continentCount / rows)
  const xSeg = Math.floor(10000 / cols)
  const ySeg = Math.floor(10000 / rows)
  out = out
    .replace(/- 网格布局:\s*\d+行\s*×\s*\d+列/g, `- 网格布局: ${rows}行 × ${cols}列`)
    .replace(/- X轴分段:\s*每段\d+像素（游戏坐标）/g, `- X轴分段: 每段${xSeg}像素（游戏坐标）`)
    .replace(/- Y轴分段:\s*每段\d+像素（游戏坐标）/g, `- Y轴分段: 每段${ySeg}像素（游戏坐标）`)

  return out
}

function buildExternalWorldGenPromptBundle() {
  const parts: string[] = []
  const all = promptsAll as any
  const sanitize = (raw: string) => {
    let s = String(raw || '')
    // 世界生成仅需要结构约束与地图生成规则；剔除叙事/指令/行动选项/思维链等与本任务冲突的部分
    s = s.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    s = s.replace(/##\s*1\.\s*输出顺序[\s\S]*?(?=\n\n##|\n\n---|$)/g, '')
    s = s.replace(/思维链必填[\s\S]*?(?=\n\n##|\n\n---|$)/g, '')
    s = s.replace(/action_options[\s\S]*?(?=\n\n##|\n\n---|$)/g, '')
    s = s.replace(/tavern_commands[\s\S]*?(?=\n\n##|\n\n---|$)/g, '')
    return s.trim()
  }

  if (typeof all?.coreRules === 'string' && all.coreRules.trim()) parts.push(sanitize(all.coreRules))
  if (typeof all?.worldGeneration === 'string' && all.worldGeneration.trim()) parts.push(sanitize(all.worldGeneration))
  const tips = String(tipsPromptRaw || '')
  if (tips.trim()) {
    const maxChars = 20000
    parts.push(sanitize(tips.length > maxChars ? tips.slice(0, maxChars) : tips))
  }
  return parts.filter(Boolean).join('\n\n---\n\n')
}

async function buildWorldGenerationSystemPrompt(input: WorldGenerationInput) {
  const continentCount = input.counts?.continentCount ?? 3
  const factionCount = input.counts?.factionCount ?? 5
  const locationCount = input.counts?.locationCount ?? 10
  const secretRealmsCount = Math.min(locationCount, Math.max(0, input.counts?.secretRealmsCount ?? Math.min(5, locationCount)))

  const externalBundle = buildExternalWorldGenPromptBundle()
  const baseFromStore = await promptStore.getResolved('worldGeneration', { allowOverrides: true })
  const base = patchWorldGenPromptLikeOriginal(externalBundle || baseFromStore, input)

  const override =
    '\n\n---\n\n' +
    '【最高优先级覆盖规则】\n' +
    '1) 输出顺序建议：先输出<thinking>...</thinking>，再输出一个JSON对象（可用```json代码块包裹）。若接口/模型强制response_format=json_object，则允许直接输出纯JSON。\n' +
    '2) 顶层只允许 continents / factions / locations 三个字段。\n' +
    `3) continents 数量必须为 ${continentCount}，factions 数量必须为 ${factionCount}，locations 数量必须为 ${locationCount}。\n` +
    `3.1) locations 中必须包含秘境类地点（例如 类型包含“秘境”/“遗迹”/“洞天”），数量至少 ${secretRealmsCount} 个。\n` +
    '4) locations 每项必须包含 coordinates: {x:number,y:number} 且范围 0-10000。\n' +
    '5) 若上方基础提示词内出现固定数量要求，以本覆盖规则为准。\n'

  return `${base}${override}`
}

function asBounds(raw: any): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const minX = asNumber(raw.minX ?? raw.left ?? raw.x0 ?? raw.min_x, NaN)
  const minY = asNumber(raw.minY ?? raw.top ?? raw.y0 ?? raw.min_y, NaN)
  const maxX = asNumber(raw.maxX ?? raw.right ?? raw.x1 ?? raw.max_x, NaN)
  const maxY = asNumber(raw.maxY ?? raw.bottom ?? raw.y1 ?? raw.max_y, NaN)
  if (![minX, minY, maxX, maxY].every((n) => Number.isFinite(n))) return undefined
  return {
    minX: clampInt(minX, 0, 10000),
    minY: clampInt(minY, 0, 10000),
    maxX: clampInt(maxX, 0, 10000),
    maxY: clampInt(maxY, 0, 10000)
  }
}

function normalizeContinentBorderPoints(raw: any): { x: number; y: number }[] | undefined {
  const arr: any[] = Array.isArray(raw) ? raw : []
  if (arr.length === 0) return undefined

  const out: { x: number; y: number }[] = []
  for (const p of arr) {
    if (p && typeof p === 'object') {
      const x = asNumber((p as any).x ?? (p as any)[0], NaN)
      const y = asNumber((p as any).y ?? (p as any)[1], NaN)
      if (Number.isFinite(x) && Number.isFinite(y)) {
        out.push({ x: clampInt(x, 0, 10000), y: clampInt(y, 0, 10000) })
        continue
      }
    }

    if (typeof p === 'string') {
      const m = p.trim().match(/^\s*([+\-]?\d+(?:\.\d+)?)\s*[,\s]\s*([+\-]?\d+(?:\.\d+)?)\s*$/)
      if (m) {
        const x = asNumber(m[1], NaN)
        const y = asNumber(m[2], NaN)
        if (Number.isFinite(x) && Number.isFinite(y)) {
          out.push({ x: clampInt(x, 0, 10000), y: clampInt(y, 0, 10000) })
        }
      }
    }
  }

  return out.length > 0 ? out : undefined
}

function boundsFromBorderPoints(points: { x: number; y: number }[] | undefined): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
  if (!Array.isArray(points) || points.length === 0) return undefined
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const p of points) {
    const x = Number(p?.x)
    const y = Number(p?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  if (![minX, minY, maxX, maxY].every((n) => Number.isFinite(n))) return undefined
  return { minX, minY, maxX, maxY }
}

function ensureContinentBounds(continents: ContinentInfo[], mapConfig: Record<string, any>) {
  if (!Array.isArray(continents) || continents.length === 0) return

  for (let i = 0; i < continents.length; i++) {
    const c = continents[i]
    if (!c) continue
    if (c.bounds && Number.isFinite(c.bounds.minX) && Number.isFinite(c.bounds.minY) && Number.isFinite(c.bounds.maxX) && Number.isFinite(c.bounds.maxY)) {
      continue
    }
    const derived = boundsFromBorderPoints(c.大洲边界)
    if (derived) c.bounds = derived
  }

  const grid = mapConfig?.grid
  if (!grid || typeof grid !== 'object') return
  const rows = clampInt((grid as any).rows, 1, 20)
  const cols = clampInt((grid as any).cols, 1, 20)
  const xSeg = clampInt((grid as any).xSeg, 1, 10000)
  const ySeg = clampInt((grid as any).ySeg, 1, 10000)
  for (let i = 0; i < continents.length; i++) {
    const c = continents[i]
    if (c && c.bounds && Number.isFinite(c.bounds.minX) && Number.isFinite(c.bounds.minY) && Number.isFinite(c.bounds.maxX) && Number.isFinite(c.bounds.maxY)) {
      continue
    }
    const r = Math.floor(i / cols)
    const col = i % cols
    const minX = col * xSeg
    const maxX = col === cols - 1 ? 10000 : (col + 1) * xSeg
    const minY = r * ySeg
    const maxY = r === rows - 1 ? 10000 : (r + 1) * ySeg
    if (c) {
      c.bounds = { minX, minY, maxX, maxY }
    }
  }
}

async function generateWorldInfoByOpenAiCompat(input: WorldGenerationInput, options: WorldGenerationOptions): Promise<WorldInfo> {
  const port = options.openAiCompat
  if (!port?.baseUrl) throw new Error('AI Base URL未配置')
  if (!port.model) throw new Error('AI模型未配置')

  const timeoutMs = typeof port.timeoutMs === 'number' ? port.timeoutMs : 240000
  const temperature = typeof port.temperature === 'number' && Number.isFinite(port.temperature) ? port.temperature : 0.7
  const requestedMaxTokens = typeof port.maxTokens === 'number' && Number.isFinite(port.maxTokens) ? port.maxTokens : 2048
  const modelLower = String(port.model || '').toLowerCase()
  const baseLower = String(port.baseUrl || '').toLowerCase()
  const deepSeekCap = 64000
  const cap = baseLower.includes('deepseek') || modelLower.includes('deepseek') ? deepSeekCap : Number.POSITIVE_INFINITY
  const maxTokens = Math.min(cap, Math.max(8192, requestedMaxTokens))

  const baseParams = {
    baseUrl: port.baseUrl,
    apiKey: port.apiKey,
    model: port.model,
    temperature,
    maxTokens,
    messages: [
      { role: 'system' as const, content: '' },
      { role: 'user' as const, content: '' }
    ],
    extraBody: (() => {
      const base = String(port.baseUrl || '').toLowerCase()
      const model = String(port.model || '').toLowerCase()
      if (base.includes('deepseek') || base.includes('/deepseek') || model.includes('deepseek')) {
        return { response_format: { type: 'json_object' } }
      }
      return undefined
    })(),
    timeoutMs
  }

  const maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : 3
  const retryDelayMs = typeof options.retryDelayMs === 'number' ? options.retryDelayMs : 1200
  let lastErr: unknown = null

  const baseCounts = {
    continentCount: input.counts?.continentCount,
    factionCount: input.counts?.factionCount,
    locationCount: input.counts?.locationCount,
    secretRealmsCount: input.counts?.secretRealmsCount
  }

  for (let attempt = 1; attempt <= Math.max(1, maxRetries); attempt++) {
    try {
      const attemptCounts = reduceCountsForRetry(baseCounts, attempt - 1)
      const inputAttempt: WorldGenerationInput = {
        ...input,
        counts: attemptCounts
      }
      const mapConfig = input.mapConfig || buildDefaultMapConfig(inputAttempt)

      const systemPrompt = await buildWorldGenerationSystemPrompt(inputAttempt)
      const userPayload = {
        worldName: inputAttempt.worldName,
        worldEra: inputAttempt.worldEra,
        worldBackground: inputAttempt.worldBackground,
        characterBackground: inputAttempt.characterBackground,
        continentCount: inputAttempt.counts?.continentCount,
        factionCount: inputAttempt.counts?.factionCount,
        locationCount: inputAttempt.counts?.locationCount,
        secretRealmsCount: inputAttempt.counts?.secretRealmsCount,
        mapConfig
      }

      options.onProgress?.('🌍 世界生成：调用AI...')
      const userContent = `请根据以下输入生成世界架构数据。\n\n输入(JSON)：\n${JSON.stringify(userPayload)}\n\n输出要求：\n- 输出顺序建议：先输出<thinking>...</thinking>，再输出一个JSON对象（可用\`\`\`json代码块包裹）。若接口/模型强制response_format=json_object，则允许直接输出纯JSON。\n- 严格只输出一个JSON对象（禁止任何解释文字）\n- 只包含 3 个字段：continents / factions / locations\n- locations 每项必须包含 coordinates: {x:number, y:number} 且坐标范围 0-10000\n- locations 中至少包含 ${Math.min(
        Number(inputAttempt.counts?.secretRealmsCount ?? 0) || 0,
        Number(inputAttempt.counts?.locationCount ?? 0) || 0
      )} 个秘境/遗迹类地点（类型包含“秘境/遗迹/洞天/禁地”等关键词）\n- 不要输出 world_name/world_background/player_spawn 等其它字段`

      let text = ''
      const shouldStream = !!options.onProgress
      if (shouldStream) {
        let preview = ''
        try {
          text = await chatCompletionText({
            ...baseParams,
            messages: [
              { role: 'system' as const, content: systemPrompt },
              { role: 'user' as const, content: userContent }
            ],
            stream: true,
            stripThinking: true,
            allowReasoningFallbackWhenContentEmpty: String(port.model || '').toLowerCase().includes('reasoner'),
            onStreamChunk: (chunk) => {
              preview += chunk
              if (preview.length > 180) preview = preview.slice(-180)
              options.onProgress?.(`🌍 世界生成中...\n\n${preview}...`)
            }
          })
        } catch {
          text = ''
        }
      }

      if (!text) {
        text = await chatCompletionText({
          ...baseParams,
          messages: [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: userContent }
          ]
        })
      }

      text = stripThinkingText(text)

      options.onProgress?.('🌍 世界生成：AI输出完成，开始解析与校验...')

      let raw: any
      try {
        raw = extractJson(text)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const snippet = String(text || '').slice(0, 600)
        throw new Error(`世界生成JSON解析失败: ${msg}\nAI响应片段: ${snippet}`)
      }

      raw = unwrapWorldData(raw)
      const data = normalizeWorldInfo(raw, inputAttempt, 'openai_compat', mapConfig)
      const seedBase = `${inputAttempt.worldName}|${inputAttempt.worldEra}|${inputAttempt.worldBackground}|${inputAttempt.characterBackground}|${inputAttempt.seed ?? ''}`
      ensureLocationCoordinates(data.地点信息, seedBase)
      ensureUniqueCoordinates(data.地点信息, seedBase)
      ensureUniqueNames(data.势力信息, (x) => x.名称, (x, n) => (x.名称 = n))
      ensureUniqueNames(data.地点信息, (x) => x.名称, (x, n) => (x.名称 = n))
      validateWorldInfo(data, inputAttempt)
      return data
    } catch (e) {
      lastErr = e
      if (attempt >= Math.max(1, maxRetries)) break
      options.onProgress?.(`🌍 世界生成：校验失败，准备重试（${attempt}/${Math.max(1, maxRetries)}）...`)
      await sleep(retryDelayMs * attempt)
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr)
  const networkLike = typeof msg === 'string' && /failed to fetch|network\s*error|TypeError: Failed to fetch/i.test(msg)
  const urlHint = (() => {
    const base = options.openAiCompat?.baseUrl
    const model = options.openAiCompat?.model
    if (!base && !model) return ''
    return `（Base URL: ${base || '未配置'}，模型: ${model || '未配置'}）`
  })()
  const friendly =
    networkLike && options.openAiCompat?.baseUrl
      ? '可能原因：1) Base URL 填写错误或未带协议(http/https)；2) 浏览器跨域/CORS 或 HTTPS 页面调用 HTTP 导致被拦截；3) 服务端未监听 /v1/chat/completions。请检查设置或改用自定义API。'
      : ''
  throw new Error(`世界生成失败：${friendly ? `${friendly} ` : ''}${msg}${urlHint ? ` ${urlHint}` : ''}`)
}

export type CustomApiPort = {
  baseUrl: string
  apiKey?: string
  endpointPath?: string
  timeoutMs?: number
}

export type OpenAiCompatPort = {
  baseUrl: string
  apiKey?: string
  model: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

export type WorldGenerationOptions = {
  provider?: WorldGenerationProvider
  customApi?: CustomApiPort
  openAiCompat?: OpenAiCompatPort
  onProgress?: (text: string) => void
  maxRetries?: number
  retryDelayMs?: number
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function pick<T>(rand: () => number, list: T[]) {
  return list[Math.floor(rand() * list.length)]
}

function normalizeFiniteNumber(n: any, fallback: number) {
  const v = Number(n)
  return Number.isFinite(v) ? v : fallback
}

function clampInt(n: any, min: number, max: number) {
  const v = Math.floor(normalizeFiniteNumber(n, min))
  return Math.min(max, Math.max(min, v))
}

function pickUnique<T>(rand: () => number, list: T[], count: number) {
  const src = [...list]
  const out: T[] = []
  while (src.length && out.length < Math.max(0, Math.floor(count))) {
    const idx = Math.floor(rand() * src.length)
    out.push(src[idx])
    src.splice(idx, 1)
  }
  return out
}

function buildChineseName(rand: () => number) {
  const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜']
  const given1 = ['清', '玄', '明', '云', '霜', '岳', '风', '鸿', '景', '寒', '星', '月', '河', '临', '照', '凌', '宁', '岚', '渊', '尘', '墨', '阙', '霄', '辰', '瑶', '璃', '烬']
  const given2 = ['子', '然', '尘', '霄', '衡', '川', '歌', '舟', '羽', '岚', '渊', '策', '鸣', '珏', '瑾', '奕', '澜', '烨', '玄', '青', '白', '离', '御', '宁', '真']
  const s = pick(rand, surnames)
  const g = pick(rand, given1) + (rand() > 0.45 ? pick(rand, given2) : '')
  return `${s}${g}`
}

function buildMemberTotalByLevel(rand: () => number, level: string) {
  const t = String(level || '')
  if (t.includes('超级')) return clampInt(5000 + rand() * 4000, 2000, 20000)
  if (t.includes('一流')) return clampInt(1500 + rand() * 1600, 400, 12000)
  if (t.includes('二流')) return clampInt(500 + rand() * 800, 150, 8000)
  return clampInt(200 + rand() * 500, 30, 5000)
}

function buildRealmDistribution(rand: () => number, total: number) {
  const realms = ['炼气', '筑基', '金丹', '元婴', '化神', '返虚', '合体', '大乘', '渡劫']
  const weights = realms.map((_, i) => Math.max(0.0001, Math.pow(0.55, i) * (0.8 + rand() * 0.4)))
  const sum = weights.reduce((a, b) => a + b, 0)
  const counts: number[] = weights.map((w) => Math.floor((w / sum) * total))
  let used = counts.reduce((a, b) => a + b, 0)
  while (used < total) {
    counts[0] += 1
    used++
  }
  // 保证高境界至少有一点存在感（超级/一流更明显）
  const boost = Math.min(total, clampInt(total * 0.002 + rand() * 2, 0, 6))
  if (boost > 0) {
    const idx = clampInt(3 + rand() * 3, 3, realms.length - 1)
    counts[idx] += boost
    counts[0] = Math.max(0, counts[0] - boost)
  }

  const out: Record<string, number> = {}
  for (let i = 0; i < realms.length; i++) {
    const n = Math.max(0, Math.floor(counts[i]))
    if (n > 0) out[`${realms[i]}期`] = n
  }
  return out
}

function buildPositionDistribution(rand: () => number, total: number) {
  const roles = ['外门弟子', '内门弟子', '核心弟子', '传承弟子', '执事', '长老', '太上长老', '副掌门', '掌门']
  const base = {
    外门弟子: 0.68,
    内门弟子: 0.18,
    核心弟子: 0.03,
    传承弟子: 0.04,
    执事: 0.02,
    长老: 0.008,
    太上长老: 0.002,
    副掌门: 0.001,
    掌门: 0.001
  } as Record<string, number>

  const counts: Record<string, number> = {}
  let used = 0
  for (const r of roles) {
    const w = base[r] ?? 0
    const jitter = 0.85 + rand() * 0.3
    const n = Math.floor(total * w * jitter)
    if (n > 0) counts[r] = n
    used += n
  }
  // 修正总数
  const rest = Math.max(0, total - used)
  counts['外门弟子'] = (counts['外门弟子'] ?? 0) + rest
  counts['掌门'] = Math.max(1, counts['掌门'] ?? 1)
  counts['副掌门'] = Math.max(1, counts['副掌门'] ?? 1)
  return counts
}

function defaultHostilityByRelation(relation: string) {
  const t = String(relation || '')
  if (t.includes('友好')) return 10
  if (t.includes('亲近')) return 5
  if (t.includes('中立')) return 30
  if (t.includes('冷淡')) return 45
  if (t.includes('敌对')) return 80
  return 30
}

function leaderRealmByLevel(level: string, role: string, rand: () => number) {
  const t = String(level || '')
  if (t.includes('超级')) {
    if (role.includes('宗主') || role.includes('掌门')) return rand() > 0.5 ? '化神圆满' : '化神后期'
    if (role.includes('副')) return rand() > 0.5 ? '化神后期' : '元婴圆满'
    return rand() > 0.6 ? '元婴后期' : '金丹圆满'
  }
  if (t.includes('一流')) {
    if (role.includes('宗主') || role.includes('掌门')) return rand() > 0.5 ? '元婴圆满' : '元婴后期'
    if (role.includes('副')) return rand() > 0.5 ? '元婴后期' : '金丹圆满'
    return rand() > 0.6 ? '金丹后期' : '金丹中期'
  }
  if (t.includes('二流')) {
    if (role.includes('宗主') || role.includes('掌门')) return rand() > 0.5 ? '金丹圆满' : '金丹后期'
    if (role.includes('副')) return rand() > 0.5 ? '金丹后期' : '筑基圆满'
    return rand() > 0.6 ? '筑基后期' : '筑基中期'
  }
  if (role.includes('宗主') || role.includes('掌门')) return rand() > 0.5 ? '筑基圆满' : '筑基后期'
  if (role.includes('副')) return rand() > 0.5 ? '筑基后期' : '炼气圆满'
  return rand() > 0.6 ? '炼气后期' : '炼气中期'
}

function buildMainResources(rand: () => number, type: string, features: string[]) {
  const pool = ['灵石', '功法', '炼器资源', '炼丹资源', '符箓资源', '阵法材料', '灵兽', '灵药', '矿脉', '秘境情报', '护山大阵']
  const out = new Set<string>()
  const joined = `${type || ''} ${(features || []).join(' ')}`
  if (/丹/.test(joined)) out.add('炼丹资源')
  if (/器/.test(joined)) out.add('炼器资源')
  if (/符/.test(joined)) out.add('符箓资源')
  if (/阵/.test(joined)) out.add('阵法材料')
  if (/御兽|兽/.test(joined)) out.add('灵兽')
  while (out.size < 3) {
    out.add(pick(rand, pool))
  }
  return Array.from(out)
}

function normalizeFactionInfo(f: any, params: { idx: number; seedBase: string; continents: string[] }) {
  if (!f || typeof f !== 'object') return f
  const seed = createSeedFromText(`${params.seedBase}|faction|${params.idx}|${String(f?.名称 || f?.name || '')}`)
  const rand = lcg(seed)

  const 名称 = String(f?.名称 || f?.name || `势力${params.idx + 1}`)
  const 类型 = String(f?.类型 || f?.type || '宗门')
  const 等级 = String(f?.等级 || f?.level || '三流')
  const 位置 = String(f?.位置 || f?.location || '')
  const 特色 = Array.isArray(f?.特色 || f?.features) ? (f?.特色 || f?.features).map((x: any) => String(x)).filter(Boolean) : []

  const 所在大洲 = String(f?.所在大洲 || f?.continent || '') || (params.continents.length ? params.continents[params.idx % params.continents.length] : '')

  const total = (() => {
    const cn = f?.成员数量?.总数 ?? f?.成员统计?.总人数
    const en = f?.memberCount?.总数 ?? f?.memberCount?.total
    const raw = cn ?? en
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= 0) return Math.max(0, Math.floor(parsed))
    return buildMemberTotalByLevel(rand, 等级)
  })()

  const realmDist = (() => {
    const d = f?.境界分布 ?? f?.memberCount?.realmDistribution ?? f?.memberCount?.境界分布
    if (d && typeof d === 'object' && !Array.isArray(d)) return d
    return buildRealmDistribution(rand, total)
  })()

  const posDist = (() => {
    const d = f?.职位分布 ?? f?.memberCount?.positionDistribution ?? f?.memberCount?.职位分布
    if (d && typeof d === 'object' && !Array.isArray(d)) return d
    return buildPositionDistribution(rand, total)
  })()

  const leaders = (() => {
    const raw = f?.领导层 ?? f?.leadership
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw
    const 宗主Name = buildChineseName(rand)
    const 宗主 = `${宗主Name}（${leaderRealmByLevel(等级, '宗主', rand)}）`
    let 副宗主Name = buildChineseName(rand)
    if (副宗主Name === 宗主Name) 副宗主Name = buildChineseName(rand)
    let 副宗主 = `${副宗主Name}（${leaderRealmByLevel(等级, '副宗主', rand)}）`
    if (副宗主 === 宗主) {
      副宗主Name = buildChineseName(rand)
      副宗主 = `${副宗主Name}（${leaderRealmByLevel(等级, '副宗主', rand)}）`
    }
    const elders = pickUnique(rand, Array.from({ length: 6 }).map(() => buildChineseName(rand)), 3)
    const 长老 = elders.map((x) => `${x}（${leaderRealmByLevel(等级, '长老', rand)}）`)
    return { 宗主, 副宗主, 长老 }
  })()

  const power = (() => {
    const p = f?.综合实力 ?? f?.power
    if (p !== undefined) return clampInt(p, 0, 100)
    let base = 35
    if (等级.includes('二流')) base = 55
    if (等级.includes('一流')) base = 70
    if (等级.includes('超级')) base = 82
    return clampInt(base + rand() * 18 - 6, 5, 100)
  })()

  const resources = (() => {
    const r = f?.主要资源 ?? f?.resources
    if (Array.isArray(r)) return r.map((x: any) => String(x)).filter(Boolean)
    return buildMainResources(rand, 类型, 特色)
  })()

  f.名称 = 名称
  f.类型 = 类型
  f.等级 = 等级
  if (!f.位置) f.位置 = 位置
  f.所在大洲 = 所在大洲
  f.主要资源 = resources
  f.综合实力 = power
  f.领导层 = leaders
  f.leadership = f.leadership && typeof f.leadership === 'object' ? f.leadership : leaders

  f.成员数量 = f.成员数量 && typeof f.成员数量 === 'object' ? f.成员数量 : {}
  ;(f.成员数量 as any).总数 = total

  f.memberCount = f.memberCount && typeof f.memberCount === 'object' ? f.memberCount : {}
  ;(f.memberCount as any).total = total

  f.境界分布 = realmDist
  ;(f.memberCount as any).realmDistribution = realmDist

  f.职位分布 = posDist
  ;(f.memberCount as any).positionDistribution = posDist

  if (f.声望值 === undefined && f.prestige !== undefined) {
    f.声望值 = clampInt(f.prestige, 0, 999999)
  }
  if (f.声望值 === undefined) {
    f.声望值 = clampInt(rand() * 60, 0, 999999)
  }
  if (f.与玩家关系 === undefined && f.relation !== undefined) {
    f.与玩家关系 = String(f.relation || '')
  }
  if (f.与玩家关系 === undefined) {
    f.与玩家关系 = '中立'
  }

  if (f.敌意值 === undefined) {
    f.敌意值 = clampInt(defaultHostilityByRelation(String(f.与玩家关系 || '')), 0, 100)
  }

  // 兼容旧字段：中文为主，英文保留
  if (f.canJoin === undefined && f.可否加入 !== undefined) f.canJoin = !!f.可否加入
  if (f.可否加入 === undefined && f.canJoin !== undefined) f.可否加入 = !!f.canJoin

  if (!Array.isArray(f.加入条件) && Array.isArray(f.joinRequirements)) f.加入条件 = f.joinRequirements
  if (!Array.isArray(f.joinRequirements) && Array.isArray(f.加入条件)) f.joinRequirements = f.加入条件

  if (!Array.isArray(f.加入好处) && Array.isArray(f.benefits)) f.加入好处 = f.benefits
  if (!Array.isArray(f.benefits) && Array.isArray(f.加入好处)) f.benefits = f.加入好处

  if (!Array.isArray(f.特色) && Array.isArray(f.features)) f.特色 = f.features
  if (!Array.isArray(f.features) && Array.isArray(f.特色)) f.features = f.特色

  return f
}

function normalizeFactionsInWorld(world: any, input: WorldGenerationInput) {
  if (!world || typeof world !== 'object') return
  const factions = Array.isArray((world as any).势力信息) ? ((world as any).势力信息 as any[]) : []
  if (factions.length === 0) return
  const continents = Array.isArray((world as any).大陆信息) ? ((world as any).大陆信息 as any[]) : []
  const continentNames = continents.map((x) => String(x?.名称 || '')).filter(Boolean)
  const seedBase = `${input.worldName}|${input.worldEra}|${input.worldBackground}|${input.characterBackground}|${(world as any)?.地图配置?.seed ?? input.seed ?? ''}`
  for (let i = 0; i < factions.length; i++) {
    factions[i] = normalizeFactionInfo(factions[i], { idx: i, seedBase, continents: continentNames })
  }
  ;(world as any).势力信息 = factions
  if ((world as any).地图 && typeof (world as any).地图 === 'object') {
    ;(world as any).地图.factions = factions
  }
}

function createSeedFromText(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced && fenced[1]) {
    const inside = fenced[1].trim()
    try {
      return jsonParseLenient(inside)
    } catch {
      const foundInside = findJsonObjectWithKeys(inside)
      if (foundInside) return jsonParseLenient(foundInside)
    }
  }

  const found = findJsonObjectWithKeys(text)
  if (found) return jsonParseLenient(found)

  throw new Error('无法解析AI响应中的JSON数据')
}

function findJsonObjectWithKeys(text: string) {
  const s = String(text || '')
  const candidates: string[] = []
  let inString = false
  let escaped = false
  let depth = 0
  let start = -1

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') {
      if (depth === 0) start = i
      depth++
      continue
    }
    if (ch === '}') {
      if (depth > 0) depth--
      if (depth === 0 && start >= 0) {
        candidates.push(s.slice(start, i + 1))
        start = -1
      }
    }
  }

  for (const cand of candidates) {
    try {
      const obj = jsonParseLenient(cand)
      if (obj && typeof obj === 'object' && Array.isArray((obj as any).continents) && Array.isArray((obj as any).factions) && Array.isArray((obj as any).locations)) {
        return cand
      }
      if (obj && typeof obj === 'object' && (obj as any).world_data && typeof (obj as any).world_data === 'object') {
        const wd: any = (obj as any).world_data
        if (wd && Array.isArray(wd.continents) && Array.isArray(wd.factions) && Array.isArray(wd.locations)) {
          return cand
        }
      }
    } catch {
      continue
    }
  }

  return ''
}

function unwrapWorldData(raw: any) {
  if (raw && typeof raw === 'object' && raw.world_data && typeof raw.world_data === 'object') return raw.world_data
  return raw
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function asString(v: any, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return fallback
}

function asNumber(v: any, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function clampCoord(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.min(10000, Math.max(0, n))
}

function ensureLocationCoordinates(locations: LocationInfo[], seedBase: string) {
  const rand = lcg(createSeedFromText(seedBase))
  for (const l of locations) {
    const rawX = l?.coordinates?.x
    const rawY = l?.coordinates?.y
    const hasX = typeof rawX === 'number' && Number.isFinite(rawX)
    const hasY = typeof rawY === 'number' && Number.isFinite(rawY)
    if (!hasX || !hasY) {
      l.coordinates = {
        x: Math.floor(rand() * 10000),
        y: Math.floor(rand() * 10000)
      }
      continue
    }
    l.coordinates = { x: clampCoord(rawX), y: clampCoord(rawY) }
  }
}

function validateWorldInfo(world: WorldInfo, input: WorldGenerationInput) {
  const expectedContinents = input.counts?.continentCount
  const expectedFactions = input.counts?.factionCount
  const expectedLocations = input.counts?.locationCount

  if (typeof expectedContinents === 'number' && expectedContinents > 0 && world.大陆信息.length !== expectedContinents) {
    throw new Error(
      `大陆数量不正确，期望${expectedContinents}个，实际${world.大陆信息.length}个。` +
        `（可能因AI输出被截断：请到设置提高“最大输出Token(max_tokens)”，建议>=8192，并确保只输出 continents/factions/locations）`
    )
  }
  if (typeof expectedFactions === 'number' && expectedFactions > 0 && world.势力信息.length !== expectedFactions) {
    throw new Error(
      `势力数量不正确，期望${expectedFactions}个，实际${world.势力信息.length}个。` +
        `（可能因AI输出被截断：请到设置提高“最大输出Token(max_tokens)”，建议>=8192，并确保只输出 continents/factions/locations）`
    )
  }
  if (typeof expectedLocations === 'number' && expectedLocations > 0 && world.地点信息.length !== expectedLocations) {
    throw new Error(
      `地点数量不正确，期望${expectedLocations}个，实际${world.地点信息.length}个。` +
        `（可能因AI输出被截断：请到设置提高“最大输出Token(max_tokens)”，建议>=8192，并确保每个location都含coordinates）`
    )
  }

  const factionNames = world.势力信息.map((x) => x.名称).filter(Boolean)
  if (factionNames.length !== new Set(factionNames).size) {
    throw new Error('势力名称存在重复')
  }

  const locationNames = world.地点信息.map((x) => x.名称).filter(Boolean)
  if (locationNames.length !== new Set(locationNames).size) {
    throw new Error('地点名称存在重复')
  }

  const superCount = world.势力信息.reduce((n, f) => (f.等级 === '超级' ? n + 1 : n), 0)
  if (superCount > 1) {
    throw new Error(`超级势力不能超过1个（当前${superCount}个）`)
  }

  if (input.worldName && world.世界名称 && world.世界名称 !== input.worldName) {
    throw new Error(`世界名称必须与玩家选择一致（期望${input.worldName}，实际${world.世界名称}）`)
  }
}

function normalizeWorldInfo(raw: any, input: WorldGenerationInput, provider: WorldGenerationProvider, mapConfig: Record<string, any>): WorldInfo {
  const obj = raw && typeof raw === 'object' ? raw : {}

  const continentsRaw = Array.isArray((obj as any).大陆信息) ? (obj as any).大陆信息 : (obj as any).continents
  const factionsRaw = Array.isArray((obj as any).势力信息) ? (obj as any).势力信息 : (obj as any).factions
  const locationsRaw = Array.isArray((obj as any).地点信息) ? (obj as any).地点信息 : (obj as any).locations

  const 大陆信息: ContinentInfo[] = Array.isArray(continentsRaw)
    ? continentsRaw
        .map((c: any) => ({
          名称: asString(c?.名称 ?? c?.name ?? c?.continent_name ?? ''),
          描述: asString(c?.描述 ?? c?.description ?? c?.desc ?? ''),
          地理特征: Array.isArray(c?.terrain_features ?? c?.地理特征 ?? c?.features ?? c?.terrain)
            ? (c?.terrain_features ?? c?.地理特征 ?? c?.features ?? c?.terrain).map((x: any) => asString(x)).filter(Boolean)
            : undefined,
          修真环境: asString(c?.cultivation_environment ?? c?.修真环境 ?? c?.cultivationEnvironment ?? ''),
          气候: asString(c?.climate ?? c?.气候 ?? ''),
          天然屏障: Array.isArray(c?.natural_barriers ?? c?.天然屏障 ?? c?.barriers)
            ? (c?.natural_barriers ?? c?.天然屏障 ?? c?.barriers).map((x: any) => asString(x)).filter(Boolean)
            : undefined,
          大洲边界: normalizeContinentBorderPoints(c?.continent_bounds ?? c?.大洲边界 ?? c?.borders),
          bounds:
            asBounds(c?.bounds ?? c?.continent_bounds_rect ?? c?.rect ?? c?.bbox) ??
            boundsFromBorderPoints(normalizeContinentBorderPoints(c?.continent_bounds ?? c?.大洲边界 ?? c?.borders))
        }))
        .filter((x: any) => x.名称 || x.描述)
    : []

  ensureContinentBounds(大陆信息, mapConfig)

  const 势力信息: FactionInfo[] = Array.isArray(factionsRaw)
    ? factionsRaw
        .map((f: any) => ({
          名称: asString(f?.名称 ?? f?.name ?? f?.faction_name ?? ''),
          类型: asString(f?.类型 ?? f?.type ?? f?.category ?? ''),
          等级: asString(f?.等级 ?? f?.level ?? f?.tier ?? ''),
          位置: asString(f?.位置 ?? f?.location ?? f?.headquarters ?? ''),
          势力范围: Array.isArray(f?.势力范围 ?? f?.territory_bounds ?? f?.territory)
            ? (f?.势力范围 ?? f?.territory_bounds ?? f?.territory).map((x: any) => asString(x)).filter(Boolean)
            : undefined,
          描述: asString(f?.描述 ?? f?.description ?? ''),
          特色: Array.isArray(f?.specialties ?? f?.特色 ?? f?.features)
            ? (f?.specialties ?? f?.特色 ?? f?.features).map((x: any) => asString(x)).filter(Boolean)
            : undefined,
          与玩家关系: asString(f?.与玩家关系 ?? f?.relation ?? '中立') || '中立',
          声望值: typeof f?.声望值 === 'number' ? f.声望值 : undefined,
          leadership: f?.leadership,
          memberCount: f?.memberCount,
          territoryInfo: f?.territoryInfo,
          canJoin: f?.canJoin,
          joinRequirements: Array.isArray(f?.joinRequirements) ? f.joinRequirements.map((x: any) => asString(x)).filter(Boolean) : undefined,
          benefits: Array.isArray(f?.benefits) ? f.benefits.map((x: any) => asString(x)).filter(Boolean) : undefined
        }))
        .filter((x: any) => x.名称)
    : []

  const 地点信息: LocationInfo[] = Array.isArray(locationsRaw)
    ? locationsRaw
        .map((l: any) => {
          const coords = l?.coordinates ?? l?.坐标 ?? l?.coord ?? {}
          const x = asNumber(coords?.x ?? l?.x, 0)
          const y = asNumber(coords?.y ?? l?.y, 0)
          return {
            名称: asString(l?.名称 ?? l?.name ?? ''),
            类型: asString(l?.类型 ?? l?.type ?? ''),
            位置: asString(l?.位置 ?? l?.location ?? ''),
            描述: asString(l?.描述 ?? l?.description ?? ''),
            coordinates: { x, y },
            特色: Array.isArray(l?.特色 ?? l?.features) ? (l?.特色 ?? l?.features).map((x: any) => asString(x)).filter(Boolean) : undefined,
            安全等级: asString(l?.安全等级 ?? l?.safety_level ?? l?.danger_level ?? ''),
            开放状态: asString(l?.开放状态 ?? l?.status ?? l?.open_status ?? ''),
            相关势力: Array.isArray(l?.相关势力 ?? l?.related_factions ?? l?.factions)
              ? (l?.相关势力 ?? l?.related_factions ?? l?.factions).map((x: any) => asString(x)).filter(Boolean)
              : undefined,
            特殊功能: Array.isArray(l?.特殊功能 ?? l?.special_functions ?? l?.functions)
              ? (l?.特殊功能 ?? l?.special_functions ?? l?.functions).map((x: any) => asString(x)).filter(Boolean)
              : undefined
          } as LocationInfo
        })
        .filter((x: any) => x.名称)
    : []

  if (地点信息.length === 0) {
    throw new Error('世界生成失败：地点信息为空（AI返回未包含locations/地点信息）。可能因输出长度不够被截断：请提高“最大输出Token(max_tokens)”，建议>=8192')
  }

  return {
    世界名称: asString((obj as any).世界名称 ?? input.worldName ?? '修仙界', input.worldName || '修仙界'),
    世界背景: asString((obj as any).世界背景 ?? input.worldBackground ?? '', input.worldBackground || ''),
    世界纪元: asString((obj as any).世界纪元 ?? input.worldEra ?? '', input.worldEra || ''),
    地图: {
      continents: 大陆信息,
      factions: 势力信息,
      features: []
    },
    大陆信息,
    势力信息,
    地点信息,
    地图配置: {
      seed: input.seed,
      provider,
      counts: input.counts || undefined,
      mapConfig
    },
    特殊设定: Array.isArray((obj as any).特殊设定 ?? (obj as any).special_settings) ? ((obj as any).特殊设定 ?? (obj as any).special_settings) : [],
    生成时间: new Date().toISOString(),
    版本: provider === 'custom_api' ? '0.2-custom' : '0.2-ai'
  }
}

async function generateWorldInfoByCustomApi(input: WorldGenerationInput, options: WorldGenerationOptions): Promise<WorldInfo> {
  const port = options.customApi
  if (!port?.baseUrl) throw new Error('自定义API未配置')

  const endpointPath = port.endpointPath || '/world/generate'
  const url = `${normalizeBaseUrl(port.baseUrl)}${endpointPath}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (port.apiKey) headers['Authorization'] = `Bearer ${port.apiKey}`

  const timeoutMs = typeof port.timeoutMs === 'number' ? port.timeoutMs : 60000
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    options.onProgress?.('🌍 世界生成：调用自定义API...')
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: ctrl.signal
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`自定义API请求失败: ${res.status} ${text}`.trim())
    }

    const data = (await res.json()) as any

    // 兼容多种返回格式：
    // 1) 直接返回 {continents,factions,locations}
    // 2) 直接返回 WorldInfo 结构
    // 3) 返回 OpenAI-compat 的 choices/message/content
    // 4) 返回 {text/content/result} 等文本字段
    const maybeText =
      typeof data?.choices?.[0]?.message?.content === 'string'
        ? data.choices[0].message.content
        : typeof data?.text === 'string'
          ? data.text
          : typeof data?.content === 'string'
            ? data.content
            : typeof data?.result === 'string'
              ? data.result
              : null

    let raw: any = data
    if (maybeText) {
      try {
        raw = extractJson(maybeText)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`自定义API世界生成：JSON解析失败: ${msg}`)
      }
    }

    raw = unwrapWorldData(raw)
    const out = normalizeWorldInfo(raw, input, 'custom_api', input.mapConfig || buildDefaultMapConfig(input))
    const seedBase = `${input.worldName}|${input.worldEra}|${input.worldBackground}|${input.characterBackground}|${input.seed ?? ''}`
    ensureLocationCoordinates(out.地点信息, seedBase)
    ensureUniqueCoordinates(out.地点信息, seedBase)
    ensureUniqueNames(out.势力信息, (x) => x.名称, (x, n) => (x.名称 = n))
    ensureUniqueNames(out.地点信息, (x) => x.名称, (x, n) => (x.名称 = n))
    validateWorldInfo(out, input)
    return out
  } finally {
    window.clearTimeout(timer)
  }
}

function generateWorldInfoLocal(input: WorldGenerationInput, options: WorldGenerationOptions): WorldInfo {
  const seed = typeof input.seed === 'number' ? input.seed : createSeedFromText(`${input.worldName}|${input.characterName}|${Date.now()}`)
  const rand = lcg(seed)

  const continentCount = input.counts?.continentCount ?? 4
  const rows = Math.ceil(Math.sqrt(continentCount))
  const cols = Math.ceil(continentCount / rows)
  const xSeg = Math.floor(10000 / cols)
  const ySeg = Math.floor(10000 / rows)
  const factionCount = input.counts?.factionCount ?? 5
  const locationCount = input.counts?.locationCount ?? 12
  const secretRealmsCount = Math.min(locationCount, Math.max(0, input.counts?.secretRealmsCount ?? Math.min(5, locationCount)))

  options.onProgress?.('🌍 世界生成：构筑大陆...')

  const continentNamePool = ['朝天', '玄霄', '太一', '青冥', '赤霄', '紫微', '沧溟', '离火', '归墟', '天阙']
  const continentAdjPool = ['东', '西', '南', '北', '中', '上', '下', '外', '内', '远']
  const terrainPool = ['灵脉纵横', '群山叠嶂', '大漠孤烟', '江河如龙', '海天一色', '寒原冰封', '火山林立', '雨林幽深']

  const 大陆信息: ContinentInfo[] = Array.from({ length: continentCount }).map((_, idx) => {
    const 名称 = `${pick(rand, continentAdjPool)}${pick(rand, continentNamePool)}大陆`
    const 地理特征 = Array.from({ length: 2 }).map(() => pick(rand, terrainPool))
    const r = Math.floor(idx / cols)
    const col = idx % cols
    const minX = col * xSeg
    const maxX = col === cols - 1 ? 10000 : (col + 1) * xSeg
    const minY = r * ySeg
    const maxY = r === rows - 1 ? 10000 : (r + 1) * ySeg
    return {
      名称: idx === 0 ? `${input.worldName}·主大陆` : 名称,
      描述: `此地灵气流转，${地理特征.join('，')}。`,
      地理特征,
      修真环境: pick(rand, ['灵气充沛', '灵气尚可', '灵气稀薄但机缘多', '灵气暴烈，适者生存']),
      气候: pick(rand, ['四季分明', '常年严寒', '终年炎热', '多雨潮湿', '风沙漫天']),
      天然屏障: [pick(rand, ['天堑', '迷雾海', '万仞山', '绝灵带', '无尽荒原'])],
      大洲边界: [],
      bounds: { minX, minY, maxX, maxY }
    }
  })

  options.onProgress?.('🌍 世界生成：孕育势力...')

  const factionTypePool = ['正道宗门', '魔道宗门', '修仙世家', '商会', '散修联盟']
  const factionLevelPool = ['三流', '二流', '一流', '超级']
  const factionFeaturePool = ['剑修鼎盛', '丹道传承', '阵法精通', '炼器闻名', '御兽秘法', '暗杀传承', '符箓繁盛', '医道独步']

  const 势力信息: FactionInfo[] = Array.from({ length: factionCount }).map((_, idx) => {
    const 名称 = idx === 0 ? '天阙宗' : `${pick(rand, continentNamePool)}${pick(rand, ['宗', '门', '府', '阁', '会'])}`
    const 类型 = pick(rand, factionTypePool)
    const 等级 = pick(rand, factionLevelPool)
    const 位置 = `${pick(rand, continentAdjPool)}${pick(rand, ['域', '州', '境', '山', '海'])}`
    return {
      名称,
      类型,
      等级,
      位置,
      描述: `此势力盘踞于${位置}，行事风格与${类型}传承相合。`,
      特色: Array.from({ length: 2 }).map(() => pick(rand, factionFeaturePool)),
      与玩家关系: idx === 0 ? '中立' : pick(rand, ['中立', '友好', '冷淡', '敌对']),
      canJoin: true,
      joinRequirements: [],
      benefits: []
    }
  })

  options.onProgress?.('🌍 世界生成：塑造地点...')

  const locationTypePool = ['宗门驻地', '凡俗城池', '坊市', '灵脉福地', '险地', '遗迹']
  const locationFeaturePool = ['灵气汇聚', '人流如织', '暗流涌动', '机缘频现', '禁制森严', '妖兽出没', '古阵残存']

  const 地点信息: LocationInfo[] = Array.from({ length: locationCount }).map((_, idx) => {
    const 类型 = idx === 0 ? '凡俗城池' : idx <= secretRealmsCount ? '秘境入口' : pick(rand, locationTypePool)
    const 名称 = idx === 0 ? '初始·青石镇' : `${pick(rand, ['青', '赤', '玄', '白', '金', '紫', '苍', '幽'])}${pick(rand, ['云', '月', '山', '河', '林', '海', '城', '谷'])}${pick(rand, ['镇', '城', '峰', '谷', '泽', '墟', '关', '坊'])}`
    const x = Math.floor(rand() * 10000)
    const y = Math.floor(rand() * 10000)
    const 所属势力 = 势力信息.length ? pick(rand, 势力信息).名称 : undefined
    return {
      名称,
      类型,
      描述: `这里是${名称}，${pick(rand, locationFeaturePool)}。`,
      位置: pick(rand, ['东境', '西境', '南境', '北境', '中境']),
      coordinates: { x, y },
      特色: Array.from({ length: 2 }).map(() => pick(rand, locationFeaturePool)),
      安全等级: pick(rand, ['较安全', '危险', '极危险']),
      开放状态: '开放',
      相关势力: 所属势力 ? [所属势力] : [],
      特殊功能: []
    }
  })

  ensureUniqueCoordinates(地点信息, `${input.worldName}|${input.worldEra}|${input.worldBackground}|${input.characterBackground}|${seed}`)
  ensureUniqueNames(势力信息, (x) => x.名称, (x, n) => (x.名称 = n))
  ensureUniqueNames(地点信息, (x) => x.名称, (x, n) => (x.名称 = n))

  return {
    世界名称: input.worldName,
    世界背景: input.worldBackground,
    世界纪元: input.worldEra,
    地图: {
      continents: 大陆信息,
      factions: 势力信息,
      features: []
    },
    大陆信息,
    势力信息,
    地点信息,
    地图配置: {
      seed,
      provider: 'local',
      counts: { continentCount, factionCount, locationCount, secretRealmsCount },
      mapConfig: input.mapConfig || buildDefaultMapConfig({ ...input, seed, counts: { continentCount, factionCount, locationCount, secretRealmsCount } })
    },
    特殊设定: [],
    生成时间: new Date().toISOString(),
    版本: '0.2-local'
  }
}

export async function generateWorldInfo(input: WorldGenerationInput, options: WorldGenerationOptions = {}): Promise<WorldInfo> {
  const provider: WorldGenerationProvider = options.provider || 'local'
  let out: WorldInfo
  if (provider === 'custom_api') {
    out = await generateWorldInfoByCustomApi(input, options)
  } else if (provider === 'openai_compat') {
    out = await generateWorldInfoByOpenAiCompat(input, options)
  } else {
    out = generateWorldInfoLocal(input, options)
  }
  normalizeFactionsInWorld(out as any, input)
  return out
}

export function pickInitialLocation(worldInfo: WorldInfo) {
  const locations = Array.isArray(worldInfo.地点信息) ? worldInfo.地点信息 : []
  const seed = typeof (worldInfo as any)?.地图配置?.seed === 'number' ? (worldInfo as any).地图配置.seed : createSeedFromText(`${worldInfo.世界名称}|${worldInfo.世界纪元}|${worldInfo.世界背景}`)
  const rand = lcg(seed)

  const isSecret = (l: any) => String(l?.类型 || '').includes('秘境') || String(l?.类型 || '').includes('遗迹') || String(l?.类型 || '').includes('洞天')
  const isSafe = (l: any) => String(l?.安全等级 || '').includes('安全')

  const safeCandidates = locations.filter((l) => !isSecret(l) && isSafe(l))
  const normalCandidates = locations.filter((l) => !isSecret(l))
  const candidates = safeCandidates.length ? safeCandidates : normalCandidates.length ? normalCandidates : locations

  const loc = candidates.length ? candidates[Math.floor(rand() * candidates.length)] : undefined
  const coords = loc?.coordinates
  return {
    描述: loc ? `${worldInfo.世界名称}·${loc.名称}` : `${worldInfo.世界名称}·未知之地`,
    x: typeof coords?.x === 'number' ? coords.x : 1000,
    y: typeof coords?.y === 'number' ? coords.y : 1000
  }
}

function reduceCountsForRetry(
  counts: {
    continentCount?: number
    factionCount?: number
    locationCount?: number
    secretRealmsCount?: number
  },
  retryIndex: number
) {
  if (retryIndex <= 0) return { ...counts }
  const factor = Math.pow(0.8, retryIndex)
  const continentCount = typeof counts.continentCount === 'number' ? Math.max(2, Math.floor(counts.continentCount * factor)) : undefined
  const factionCount = typeof counts.factionCount === 'number' ? Math.max(3, Math.floor(counts.factionCount * factor)) : undefined
  const locationCount = typeof counts.locationCount === 'number' ? Math.max(5, Math.floor(counts.locationCount * factor)) : undefined
  const secretRealmsCount = typeof counts.secretRealmsCount === 'number' ? Math.max(2, Math.floor(counts.secretRealmsCount * factor)) : undefined

  return {
    continentCount,
    factionCount,
    locationCount,
    secretRealmsCount
  }
}

function buildDefaultMapConfig(input: WorldGenerationInput) {
  const continentCount = input.counts?.continentCount ?? 3
  const rows = Math.ceil(Math.sqrt(continentCount))
  const cols = Math.ceil(continentCount / rows)
  const xSeg = Math.floor(10000 / cols)
  const ySeg = Math.floor(10000 / rows)
  return {
    coordinateSystem: { minX: 0, maxX: 10000, minY: 0, maxY: 10000, origin: 'top-left' },
    grid: { rows, cols, xSeg, ySeg },
    seed: input.seed
  }
}

function ensureUniqueNames<T>(items: T[], getName: (x: T) => string, setName: (x: T, n: string) => void) {
  const seen = new Map<string, number>()
  for (const item of items) {
    const name = String(getName(item) || '')
    if (!name) continue
    const count = seen.get(name) || 0
    if (count === 0) {
      seen.set(name, 1)
      continue
    }
    let idx = count + 1
    let next = `${name}·${idx}`
    while (seen.has(next)) {
      idx++
      next = `${name}·${idx}`
    }
    setName(item, next)
    seen.set(name, idx)
    seen.set(next, 1)
  }
}

function ensureUniqueCoordinates(locations: LocationInfo[], seedBase: string) {
  const rand = lcg(createSeedFromText(seedBase + '|coord'))
  const used = new Set<string>()
  for (const l of locations) {
    const rawX = l?.coordinates?.x
    const rawY = l?.coordinates?.y
    let x = clampCoord(typeof rawX === 'number' ? rawX : Math.floor(rand() * 10000))
    let y = clampCoord(typeof rawY === 'number' ? rawY : Math.floor(rand() * 10000))
    let key = `${x},${y}`
    while (used.has(key)) {
      x = clampCoord(x + Math.floor(rand() * 127) + 1)
      y = clampCoord(y + Math.floor(rand() * 127) + 1)
      key = `${x},${y}`
    }
    used.add(key)
    l.coordinates = { x, y }
  }
}
