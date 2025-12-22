import { chatCompletionText } from './aiClient'
import { resolveAiBaseUrl } from './aiProviders'
import { promptStore } from './promptStore'
import { tavernPromptStore } from './tavernPromptStore'
import type { SaveData } from '../stores/useGameStateStore'
import type { TavernCommand } from './tavernCommands'
import type { AiProviderPreset } from '../stores/useSettingsStore'

export type GameplayAiResponse = {
  text: string
  mid_term_memory: string
  tavern_commands: TavernCommand[]
  action_options?: string[]
}

function normalizeActionOptions(raw: unknown): string[] | undefined {
  if (raw == null) return undefined

  const normalizeLine = (s: string) =>
    s
      .trim()
      .replace(/^[-*•\d.、\s]+/, '')
      .trim()

  if (typeof raw === 'string') {
    const lines = raw
      .split(/\r?\n/)
      .map(normalizeLine)
      .filter(Boolean)
    return lines.length ? lines.slice(0, 20) : undefined
  }

  if (!Array.isArray(raw)) return undefined

  const list = raw
    .map((x: any) => {
      if (typeof x === 'string') return normalizeLine(x)
      if (!x || typeof x !== 'object') return ''
      const v =
        x.option ??
        x.text ??
        x.content ??
        x.label ??
        x.name ??
        x.内容 ??
        x.文本 ??
        x.选项
      if (typeof v === 'string') return normalizeLine(v)
      return ''
    })
    .filter(Boolean)

  return list.length ? list.slice(0, 20) : undefined
}

function extractActionOptionsFromText(text: string): string[] | undefined {
  if (!text || typeof text !== 'string') return undefined
  const lines = text.split(/\r?\n/)
  const keyRe = /(行动选项|可选行动|行动建议|建议行动|你可以|你可选择|可选择)/
  let start = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = String(lines[i] || '').trim()
    if (!l) continue
    if (keyRe.test(l)) {
      start = i + 1
      break
    }
  }
  if (start < 0 || start >= lines.length) return undefined

  const picked: string[] = []
  for (let i = start; i < lines.length; i++) {
    const rawLine = String(lines[i] || '')
    const t = rawLine.trim()
    if (!t) {
      if (picked.length) break
      continue
    }
    // stop on common section delimiter
    if (/^#+\s+/.test(t)) break

    const cleaned = t.replace(/^[-*•\d.、\s]+/, '').trim()
    if (!cleaned) continue
    picked.push(cleaned)
    if (picked.length >= 20) break
  }
  return picked.length ? picked : undefined
}

export type GameplayStage = 'build_prompt' | 'request' | 'stream' | 'parse'

export type GameplayStageEvent = {
  stage: GameplayStage
  status: 'in_progress' | 'completed' | 'error'
  detail?: string
}

function sortByInjectionOrder<T extends { injection_order?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => (Number(a.injection_order) || 999) - (Number(b.injection_order) || 999))
}

function createIncrementalJsonTextFieldExtractor() {
  const state = {
    stage: 'searchKey' as 'searchKey' | 'searchQuote' | 'collect' | 'done',
    carry: '',
    escaped: false,
    text: ''
  }

  const decodeEscape = (c: string) => {
    if (c === 'n') return '\n'
    if (c === 'r') return '\r'
    if (c === 't') return '\t'
    return c
  }

  return {
    feed(chunk: string) {
      if (!chunk) return state.text

      if (state.stage === 'done') return state.text

      let buf = state.carry + chunk
      state.carry = ''

      if (state.stage === 'searchKey') {
        const idx = buf.indexOf('"text"')
        if (idx < 0) {
          state.carry = buf.slice(Math.max(0, buf.length - 16))
          return state.text
        }
        buf = buf.slice(idx + '"text"'.length)
        state.stage = 'searchQuote'
      }

      if (state.stage === 'searchQuote') {
        const colon = buf.indexOf(':')
        if (colon < 0) {
          state.carry = buf.slice(Math.max(0, buf.length - 32))
          return state.text
        }
        buf = buf.slice(colon + 1)
        const quote = buf.indexOf('"')
        if (quote < 0) {
          state.carry = ':' + buf.slice(Math.max(0, buf.length - 32))
          return state.text
        }
        buf = buf.slice(quote + 1)
        state.stage = 'collect'
      }

      if (state.stage === 'collect') {
        for (let i = 0; i < buf.length; i++) {
          const c = buf[i]
          if (state.escaped) {
            state.text += decodeEscape(c)
            state.escaped = false
            continue
          }
          if (c === '\\') {
            state.escaped = true
            continue
          }
          if (c === '"') {
            state.stage = 'done'
            state.carry = ''
            return state.text
          }
          state.text += c
        }

        state.carry = ''
        return state.text
      }

      return state.text
    }
  }
}

function extractJson(text: string) {
  if (!text || typeof text !== 'string') {
    throw new Error('AI响应为空或格式错误')
  }
  
  const trimmed = text.trim()
  
  // 尝试直接解析
  try {
    return JSON.parse(trimmed)
  } catch {}
  
  // 尝试从```json代码块提取
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim())
    } catch {}
  }
  
  // 智能大括号匹配（原版逻辑）
  const firstBrace = trimmed.indexOf('{')
  if (firstBrace !== -1) {
    let depth = 0
    let inString = false
    let escaped = false
    
    for (let i = firstBrace; i < trimmed.length; i++) {
      const char = trimmed[i]
      
      if (escaped) {
        escaped = false
        continue
      }
      
      if (char === '\\') {
        escaped = true
        continue
      }
      
      if (char === '"') {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{') depth++
        if (char === '}') {
          depth--
          if (depth === 0) {
            const jsonStr = trimmed.substring(firstBrace, i + 1)
            try {
              return JSON.parse(jsonStr)
            } catch {}
            break
          }
        }
      }
    }
  }
  
  // 最后尝试简单正则
  const m = trimmed.match(/\{[\s\S]*\}/)
  if (m) {
    return JSON.parse(m[0])
  }
  
  throw new Error('无法解析AI响应为有效的JSON格式')
}

function buildCharacterStatusSummary(saveData: SaveData): string {
  const playerStatus = (saveData as any).玩家角色状态
  const baseInfo = (saveData as any).角色基础信息
  
  const formatTalents = (talents: any): string => {
    if (!talents) return '无'
    if (typeof talents === 'string') return talents
    if (Array.isArray(talents)) {
      return talents.map(t => {
        if (typeof t === 'string') return t
        if (typeof t === 'object' && t !== null && (t.name || t.名称)) {
          return t.name || t.名称
        }
        return ''
      }).filter(Boolean).join(', ') || '无'
    }
    return '未知格式'
  }
  
  let summary = '# 角色核心状态速览\n'
  
  if (playerStatus) {
    summary += `\n- 生命: 气血${playerStatus.气血?.当前 ?? 0}/${playerStatus.气血?.上限 ?? 0} 灵气${playerStatus.灵气?.当前 ?? 0}/${playerStatus.灵气?.上限 ?? 0} 神识${playerStatus.神识?.当前 ?? 0}/${playerStatus.神识?.上限 ?? 0} 寿元${playerStatus.寿命?.当前 ?? 0}/${playerStatus.寿命?.上限 ?? 0}`
    
    if (playerStatus.境界) {
      const realm = playerStatus.境界
      summary += `\n- 境界: ${realm.名称}-${realm.阶段} (${realm.当前进度 ?? 0}/${realm.下一级所需 ?? 0})`
    }
    
    if (playerStatus.声望 !== undefined) {
      summary += `\n- 声望: ${playerStatus.声望}`
    }
    
    if (playerStatus.状态效果 && playerStatus.状态效果.length > 0) {
      const effects = playerStatus.状态效果
        .filter((e: any) => e && typeof e === 'object' && e.状态名称)
        .map((e: any) => e.状态名称)
        .join(', ')
      if (effects) {
        summary += `\n- 状态: ${effects}`
      }
    }
  }
  
  if (baseInfo?.天赋) {
    summary += `\n- 天赋: ${formatTalents(baseInfo.天赋)}`
  }
  
  return summary
}

function getShortTermMemories(saveData: SaveData): string[] {
  const memory = (saveData as any).记忆
  if (memory?.短期记忆 && Array.isArray(memory.短期记忆)) {
    return memory.短期记忆
  }
  return []
}

export async function runGameplayTurn(params: {
  userInput: string
  saveData: SaveData
  preset: AiProviderPreset
  customApiUrl: string
  apiKey: string
  model: string
  temperature: number
  maxOutputTokens: number
  stream?: boolean
  allowPromptOverrides: boolean
  enableActionOptions?: boolean
  actionOptionsPrompt?: string
  useSystemCot?: boolean
  onProgress?: (text: string) => void
  onStage?: (ev: GameplayStageEvent) => void
}) {
  const baseUrl = resolveAiBaseUrl({ preset: params.preset, customBaseUrl: params.customApiUrl })
  if (!baseUrl) throw new Error('未配置 AI Base URL')
  if (!params.model) throw new Error('未选择模型')

  let systemPrompt = ''
  let cotPrompt = ''
  let externalPrompts: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
  try {
    params.onStage?.({ stage: 'build_prompt', status: 'in_progress' })
    if (params.allowPromptOverrides) {
      const tavernList = await tavernPromptStore.loadAll()
      externalPrompts = sortByInjectionOrder(
        (tavernList || [])
          .filter((p) => p && p.enabled && String(p.content || '').trim())
          .map((p) => {
            const role = (p.role === 'user' || p.role === 'assistant' ? p.role : 'system') as 'system' | 'user' | 'assistant'
            return { role, content: String(p.content || ''), injection_order: p.injection_order }
          })
      ).map(({ role, content }) => ({ role, content }))
    }

    const promptKeys: Array<'coreRules' | 'businessRules' | 'dataDefinitions' | 'textFormats' | 'worldStandards' | 'actionOptions' | 'questSystemRules'> = 
      ['coreRules', 'businessRules', 'dataDefinitions', 'textFormats', 'worldStandards']
    
    if (params.enableActionOptions !== false) {
      promptKeys.push('actionOptions')
    }
    
    const questSystem = (params.saveData as any).任务系统
    if (questSystem?.配置?.启用系统任务) {
      promptKeys.push('questSystemRules')
    }

    if (params.useSystemCot !== false) {
      cotPrompt = await promptStore.getResolved('cotCore', { allowOverrides: true })
      if (cotPrompt) {
        cotPrompt = cotPrompt.replace('{{\u7528\u6237\u8f93\u5165}}', params.userInput?.trim() || '\u7ee7\u7eed\u5f53\u524d\u6d3b\u52a8')
      }
    }
    
    systemPrompt = await promptStore.buildCompositePrompt(
      promptKeys,
      {
        userInput: params.userInput,
        customActionPrompt: params.actionOptionsPrompt || '',
        allowOverrides: true
      }
    )
    params.onStage?.({ stage: 'build_prompt', status: 'completed' })
  } catch (e) {
    params.onStage?.({ stage: 'build_prompt', status: 'error', detail: e instanceof Error ? e.message : String(e) })
    throw e
  }

  const cleanedSaveData = JSON.parse(JSON.stringify(params.saveData))
  try {
    if (!cleanedSaveData.系统 || typeof cleanedSaveData.系统 !== 'object') cleanedSaveData.系统 = {}
    cleanedSaveData.系统.nsfwMode = false
    cleanedSaveData.系统.nsfwGenderFilter = ''
    if (cleanedSaveData.身体部位开发 !== undefined) cleanedSaveData.身体部位开发 = {}
    const rel = cleanedSaveData.人物关系
    if (rel && typeof rel === 'object') {
      for (const v of Object.values(rel)) {
        if (!v || typeof v !== 'object') continue
        if ((v as any).私密信息 !== undefined) delete (v as any).私密信息
      }
    }
  } catch {
    void 0
  }
  if (cleanedSaveData.记忆) {
    delete cleanedSaveData.记忆.短期记忆
    delete cleanedSaveData.记忆.隐式中期记忆
  }
  if (cleanedSaveData.叙事历史) {
    delete cleanedSaveData.叙事历史
  }

  const characterSummary = buildCharacterStatusSummary(params.saveData)
  const shortTermMemories = getShortTermMemories(params.saveData)
  const userAction = params.userInput?.trim() || '继续当前活动'

  const gameStatePrompt = `
${characterSummary}

# 游戏状态
你正在修仙世界《大道朝天》中扮演GM。以下是当前完整游戏存档(JSON格式):
${JSON.stringify(cleanedSaveData)}
`.trim()

  const recentEventsPrompt = shortTermMemories.length > 0
    ? `# 【最近事件】\n${shortTermMemories.join('\n')}。根据这刚刚发生的文本事件，合理生成下一次文本信息，要保证衔接流畅、不断层，符合上文的文本信息`
    : ''

  const userContent =
    '请根据当前存档数据与玩家输入，推进剧情并更新存档。\n\n' +
    '玩家行动：' + userAction + '\n\n' +
    gameStatePrompt +
    (recentEventsPrompt ? '\n\n' + recentEventsPrompt : '') +
    '\n\n输出要求：\n' +
    '- 先输出思维链：<thinking>...</thinking>\n' +
    '- 再输出JSON（必须用```json代码块包裹），且仅输出一个JSON对象（不要额外解释文字）\n' +
    '- JSON必须包含 text / mid_term_memory / tavern_commands\n' +
    '- tavern_commands 必须是数组（至少1条）\n' +
    '- 时间推进建议使用 key="游戏时间.分钟"（也兼容 key="游戏状态.游戏时间.分钟"）\n' +
    '- 若输出 action_options，则必须是字符串数组\n\n' +
    '输出格式示例：\n<thinking>...</thinking>\n```json\n{"text":"...","mid_term_memory":"...","tavern_commands":[{"action":"add","key":"游戏时间.分钟","value":30}]}\n```'

  const userContentPatched = userContent

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    ...externalPrompts,
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userContentPatched }
  ]
  // 原版中cotCore是单独注入的system消息
  if (cotPrompt) {
    messages.push({ role: 'system' as const, content: cotPrompt })
  }

  const baseAiParams = {
    baseUrl,
    apiKey: params.apiKey,
    model: params.model,
    temperature: params.temperature,
    maxTokens: Math.max(16, Math.floor(Number(params.maxOutputTokens) || 0)),
    messages,
    timeoutMs: 180000
  }

  let rawText = ''
  if (params.onProgress && params.stream !== false) {
    const extractor = createIncrementalJsonTextFieldExtractor()
    let streamStarted = false
    try {
      params.onStage?.({ stage: 'request', status: 'in_progress' })
      rawText = await chatCompletionText({
        ...baseAiParams,
        stream: true,
        stripThinking: true,
        allowReasoningFallbackWhenContentEmpty: String(params.model || '').toLowerCase().includes('reasoner'),
        onStreamChunk: (chunk) => {
          if (!streamStarted) {
            streamStarted = true
            params.onStage?.({ stage: 'stream', status: 'in_progress' })
          }
          const t = extractor.feed(chunk)
          if (t) params.onProgress?.(t)
        }
      })
      params.onStage?.({ stage: 'request', status: 'completed' })
      if (streamStarted) params.onStage?.({ stage: 'stream', status: 'completed' })
    } catch {
      params.onStage?.({ stage: 'request', status: 'error' })
      if (streamStarted) params.onStage?.({ stage: 'stream', status: 'error' })
      rawText = ''
    }
  }

  if (!rawText) {
    params.onStage?.({ stage: 'request', status: 'in_progress' })
    rawText = await chatCompletionText(baseAiParams)
    params.onStage?.({ stage: 'request', status: 'completed' })
  }

  let parsed: Partial<GameplayAiResponse>
  try {
    params.onStage?.({ stage: 'parse', status: 'in_progress' })
    parsed = extractJson(rawText) as Partial<GameplayAiResponse>
    if (!parsed || typeof parsed !== 'object') throw new Error('AI响应解析失败')
    if (typeof parsed.text !== 'string' || !parsed.text.trim()) throw new Error('AI响应缺少text')
    if (typeof (parsed as any).mid_term_memory !== 'string' || !(parsed as any).mid_term_memory.trim()) throw new Error('AI响应缺少mid_term_memory')
    if (!Array.isArray(parsed.tavern_commands)) throw new Error('AI响应缺少tavern_commands数组')
    if (parsed.tavern_commands.length === 0) throw new Error('AI响应tavern_commands为空')

    const actionOptionsRaw = (parsed as any).action_options ?? (parsed as any).actionOptions ?? (parsed as any).行动选项
    const normalizedOptions = normalizeActionOptions(actionOptionsRaw) ?? extractActionOptionsFromText(parsed.text)
    if (actionOptionsRaw !== undefined && normalizedOptions === undefined) throw new Error('AI响应action_options类型不正确')
    params.onStage?.({ stage: 'parse', status: 'completed' })
  } catch (e) {
    params.onStage?.({ stage: 'parse', status: 'error', detail: e instanceof Error ? e.message : String(e) })
    throw e
  }

  return {
    text: parsed.text,
    mid_term_memory: (parsed as any).mid_term_memory,
    tavern_commands: parsed.tavern_commands,
    action_options:
      normalizeActionOptions((parsed as any).action_options ?? (parsed as any).actionOptions ?? (parsed as any).行动选项) ??
      extractActionOptionsFromText(parsed.text)
  }
}
