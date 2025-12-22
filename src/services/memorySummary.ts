import { chatCompletionText } from './aiClient'
import { resolveAiBaseUrl } from './aiProviders'
import { promptStore } from './promptStore'

import type { SaveData } from '../stores/useGameStateStore'
import type { TavernCommand } from './tavernCommands'
import type { AiProviderPreset, MemorySummaryMode } from '../stores/useSettingsStore'

export type MemorySummaryAiResponse = {
  text: string
  mid_term_memory: string
  tavern_commands: TavernCommand[]
}

function extractJson(text: string) {
  if (!text || typeof text !== 'string') {
    throw new Error('AI响应为空或格式错误')
  }

  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    void 0
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim())
    } catch {
      void 0
    }
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
            } catch {
              void 0
            }
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

export async function runMemorySummary(params: {
  saveData: SaveData
  midItems: string[]
  midTermKeep: number
  preset: AiProviderPreset
  customApiUrl: string
  apiKey: string
  model: string
  temperature: number
  maxOutputTokens: number
  allowPromptOverrides: boolean
  memorySummaryMode?: MemorySummaryMode
  stream?: boolean
  onProgress?: (text: string) => void
}): Promise<MemorySummaryAiResponse> {
  const baseUrl = resolveAiBaseUrl({ preset: params.preset, customBaseUrl: params.customApiUrl })
  if (!baseUrl) throw new Error('未配置 AI Base URL')
  if (!params.model) throw new Error('未选择模型')

  const mode: MemorySummaryMode = params.memorySummaryMode || 'raw'

  const allowOverrides = params.allowPromptOverrides !== false

  const systemPrompt =
    mode === 'standard'
      ? await promptStore.buildCompositePrompt(
          ['coreRules', 'businessRules', 'dataDefinitions', 'textFormats', 'worldStandards', 'memorySummary'],
          {
            userInput: '记忆总结',
            allowOverrides
          }
        )
      : await promptStore.getResolved('memorySummary', { allowOverrides })

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

  const keep = Math.max(0, Math.floor(Number(params.midTermKeep) || 0))
  const mid = Array.isArray(params.midItems) ? params.midItems.filter((x) => typeof x === 'string' && x.trim()) : []
  const keepArr = keep <= 0 ? [] : mid.slice(Math.max(0, mid.length - keep))

  const userContent =
    '请将【中期记忆】总结为1条【长期记忆】（要求精炼、包含人物/势力/地点/任务/重要变化），并用 tavern_commands 更新存档。\n' +
    '输出必须是标准游戏响应JSON（包含 text 与 tavern_commands）。\n' +
    'tavern_commands 要求：\n' +
    '- push 到 key="记忆.长期记忆" 追加1条总结结果（string）\n' +
    `- set key="记忆.中期记忆" value=${JSON.stringify(keepArr)}（保留最新${keep}条，其余转化）\n` +
    '- 不要删除记忆对象本身；不要把数组设为 null。\n\n' +
    `【当前中期记忆(${mid.length})】\n` +
    mid.map((x, i) => `${i + 1}. ${x}`).join('\n') +
    '\n\n' +
    '【存档数据(JSON)】\n' +
    JSON.stringify({ save_data: saveDataSanitized })

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
    try {
      rawText = await chatCompletionText({
        ...baseAiParams,
        stream: true,
        stripThinking: true,
        allowReasoningFallbackWhenContentEmpty: String(params.model || '').toLowerCase().includes('reasoner'),
        onStreamChunk: (chunk) => {
          const t = extractor.feed(chunk)
          if (t) params.onProgress?.(t)
        }
      })
    } catch {
      rawText = ''
    }
  }

  if (!rawText) {
    rawText = await chatCompletionText({
      ...baseAiParams,
      stream: false,
      stripThinking: true
    })
  }

  const parsed = extractJson(rawText)
  const out: MemorySummaryAiResponse = {
    text: String((parsed as any)?.text || ''),
    mid_term_memory: String((parsed as any)?.mid_term_memory || ''),
    tavern_commands: Array.isArray((parsed as any)?.tavern_commands) ? (parsed as any).tavern_commands : []
  }

  if (!out.text || out.tavern_commands.length === 0) {
    throw new Error('AI响应缺少 text 或 tavern_commands')
  }

  return out
}
