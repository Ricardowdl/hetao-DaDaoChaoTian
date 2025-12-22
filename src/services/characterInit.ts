import { chatCompletionText } from './aiClient'
import { resolveAiBaseUrl } from './aiProviders'
import { promptStore } from './promptStore'
import type { SaveData } from '../stores/useGameStateStore'
import type { TavernCommand } from './tavernCommands'
import type { AiProviderPreset, InitMode } from '../stores/useSettingsStore'

export type CharacterInitAiResponse = {
  text: string
  mid_term_memory: string
  tavern_commands: TavernCommand[]
  action_options?: string[]
}

function extractJson(text: string) {
  if (!text || typeof text !== 'string') {
    throw new Error('AI响应为空或格式错误')
  }
  
  const trimmed = text.trim()
  
  try {
    return JSON.parse(trimmed)
  } catch {}
  
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim())
    } catch {}
  }
  
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
  
  const m = trimmed.match(/\{[\s\S]*\}/)
  if (m) {
    return JSON.parse(m[0])
  }
  
  throw new Error('无法解析AI响应为有效的JSON格式')
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

export async function runCharacterInit(params: {
  saveData: SaveData
  preset: AiProviderPreset
  customApiUrl: string
  apiKey: string
  model: string
  temperature: number
  maxOutputTokens: number
  allowPromptOverrides: boolean
  initMode?: InitMode
  stream?: boolean
  onProgress?: (text: string) => void
}): Promise<CharacterInitAiResponse> {
  const baseUrl = resolveAiBaseUrl({ preset: params.preset, customBaseUrl: params.customApiUrl })
  if (!baseUrl) throw new Error('未配置 AI Base URL')
  if (!params.model) throw new Error('未选择模型')

  const initMode = params.initMode || 'generate'

  const systemPrompt =
    initMode === 'standard'
      ? await promptStore.buildCompositePrompt(
          ['coreRules', 'businessRules', 'dataDefinitions', 'textFormats', 'worldStandards', 'cotCore', 'actionOptions', 'characterInit'],
          {
            userInput: '角色初始化',
            allowOverrides: true
          }
        )
      : await promptStore.getResolved('characterInit', { allowOverrides: true })

  const saveDataSanitized = JSON.parse(JSON.stringify(params.saveData))
  try {
    if (!saveDataSanitized.系统 || typeof saveDataSanitized.系统 !== 'object') saveDataSanitized.系统 = {}
    saveDataSanitized.系统.nsfwMode = false
    saveDataSanitized.系统.nsfwGenderFilter = ''
    if (saveDataSanitized.身体部位开发 !== undefined) saveDataSanitized.身体部位开发 = {}
    const rel = saveDataSanitized.人物关系
    if (rel && typeof rel === 'object') {
      for (const v of Object.values(rel)) {
        if (!v || typeof v !== 'object') continue
        if ((v as any).私密信息 !== undefined) delete (v as any).私密信息
      }
    }
  } catch {
    void 0
  }

  const payload = {
    save_data: saveDataSanitized,
    world_info: (saveDataSanitized as any)?.世界信息 || null
  }

  const userContent =
    '请根据当前存档数据生成开场剧情，并初始化角色初始状态。\n\n' +
    '输入(JSON)：\n' +
    JSON.stringify(payload) +
    '\n\n输出要求：\n' +
    '- 先输出思维链：<thinking>...</thinking>\n' +
    '- 再输出JSON（必须用```json代码块包裹），且仅输出一个JSON对象（不要额外解释文字）\n' +
    '- JSON必须包含 text / mid_term_memory / tavern_commands\n' +
    '- tavern_commands 必须是数组（至少1条）\n' +
    '- 若输出 action_options，则必须是字符串数组\n\n' +
    '输出格式示例：\n<thinking>...</thinking>\n```json\n{"text":"...","mid_term_memory":"...","tavern_commands":[{"action":"set","key":"玩家角色状态.位置","value":{"描述":"...","x":1000,"y":1000}}],"action_options":["...","...","...","...","..."]}\n```'

  const baseAiParams = {
    baseUrl,
    apiKey: params.apiKey,
    model: params.model,
    temperature: params.temperature,
    maxTokens: Math.max(16, Math.floor(Number(params.maxOutputTokens) || 0)),
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userContent }
    ],
    timeoutMs: 180000
  }

  let rawText = ''
  if (params.onProgress && params.stream !== false) {
    const extractor = createIncrementalJsonTextFieldExtractor()
    let streamStarted = false
    try {
      rawText = await chatCompletionText({
        ...baseAiParams,
        stream: true,
        stripThinking: true,
        allowReasoningFallbackWhenContentEmpty: String(params.model || '').toLowerCase().includes('reasoner'),
        onStreamChunk: (chunk) => {
          streamStarted = true
          const t = extractor.feed(chunk)
          if (t) params.onProgress?.(t)
        }
      })
      if (streamStarted && rawText) params.onProgress(rawText)
    } catch {
      rawText = ''
    }
  }

  if (!rawText) {
    rawText = await chatCompletionText(baseAiParams)
  }

  const parsed = extractJson(rawText) as Partial<CharacterInitAiResponse>
  if (!parsed || typeof parsed !== 'object') throw new Error('AI响应解析失败')
  if (typeof parsed.text !== 'string' || !parsed.text.trim()) throw new Error('AI响应缺少text')
  if (typeof parsed.mid_term_memory !== 'string' || !parsed.mid_term_memory.trim()) throw new Error('AI响应缺少mid_term_memory')
  if (!Array.isArray(parsed.tavern_commands)) throw new Error('AI响应缺少tavern_commands数组')
  if (parsed.tavern_commands.length === 0) throw new Error('AI响应tavern_commands为空')

  const actionOptions = (parsed as any).action_options
  if (actionOptions !== undefined && !Array.isArray(actionOptions)) throw new Error('AI响应action_options类型不正确')

  return {
    text: parsed.text,
    mid_term_memory: parsed.mid_term_memory,
    tavern_commands: parsed.tavern_commands,
    action_options: Array.isArray(actionOptions) ? actionOptions.map((x: any) => String(x)).filter(Boolean) : undefined
  }
}
