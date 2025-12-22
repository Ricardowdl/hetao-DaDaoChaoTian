import { chatCompletionText } from './aiClient'
import { resolveAiBaseUrl } from './aiProviders'

import type { SaveData } from '../stores/useGameStateStore'
import type { TavernCommand } from './tavernCommands'
import type { AiProviderPreset } from '../stores/useSettingsStore'

function getGameTimeTextFromSave(saveData: any) {
  const t: any = saveData?.游戏时间
  if (!t) return ''
  const y = Number(t.年)
  const m = Number(t.月)
  const d = Number(t.日)
  const hh = Number(t.小时)
  const mm = Number(t.分钟)
  if (![y, m, d, hh, mm].every(Number.isFinite)) return ''
  return `仙道${Math.floor(y)}年${Math.floor(m)}月${Math.floor(d)}日 ${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor(mm)).padStart(2, '0')}`
}

function normalizeQuest(raw: any, saveData: any) {
  const q: any = raw && typeof raw === 'object' ? { ...raw } : {}

  const nowText = getGameTimeTextFromSave(saveData) || '未知'

  if (!q.任务ID) q.任务ID = `quest_${Date.now()}`
  q.任务ID = String(q.任务ID)
  if (!q.任务名称) q.任务名称 = q.任务ID
  q.任务名称 = String(q.任务名称)
  if (!q.任务描述) q.任务描述 = ''
  q.任务描述 = String(q.任务描述)
  if (!q.任务类型) q.任务类型 = '系统任务'
  q.任务类型 = String(q.任务类型)
  if (!q.任务状态) q.任务状态 = '进行中'
  q.任务状态 = String(q.任务状态)

  if (!q.接取时间) q.接取时间 = nowText
  if (q.完成时间 === undefined) q.完成时间 = null

  if (!Array.isArray(q.目标列表)) q.目标列表 = []
  q.目标列表 = q.目标列表
    .filter((x: any) => x && typeof x === 'object')
    .map((o: any, idx: number) => {
      const obj: any = { ...o }
      if (!obj.目标ID) obj.目标ID = `${q.任务ID}_obj_${idx + 1}`
      obj.目标ID = String(obj.目标ID)
      if (!obj.类型) obj.类型 = String(obj.类型 || '通用')
      if (!obj.描述) obj.描述 = String(obj.描述 || obj.类型 || '目标')
      obj.需求数量 = Math.max(0, Math.floor(Number(obj.需求数量 ?? 0) || 0))
      obj.当前进度 = Math.max(0, Math.floor(Number(obj.当前进度 ?? 0) || 0))
      obj.已完成 = !!obj.已完成
      return obj
    })

  if (!q.奖励 || typeof q.奖励 !== 'object') q.奖励 = {}

  return q
}

function ensurePushCommand(commands: TavernCommand[], quest: any): TavernCommand[] {
  const hasPush = commands.some((c: any) => c && c.action === 'push' && c.key === '任务系统.当前任务列表')
  if (hasPush) return commands
  return [...commands, { action: 'push', key: '任务系统.当前任务列表', value: quest } as TavernCommand]
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

function fillTemplate(template: string, vars: Record<string, string>) {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

function buildQuestSystemPrompt(params: {
  playerName: string
  realmText: string
  locationText: string
  questConfig?: { 系统任务类型?: any; 系统任务提示词?: any }
}) {
  const base = `
# 任务生成系统（寻找机缘）

## 当前状态
- 玩家姓名：{{玩家姓名}}
- 境界：{{当前境界}}
- 位置：{{当前位置}}

## 核心原则
- 本次只生成 1 个新任务
- 🎲 任务完全随机生成，不依赖当前剧情连续性
- 境界适配：任务难度和目标数量要符合当前境界
- 奖励必须有诱惑力，不能太少
- 目标必须可量化（数量/进度）

## 任务类型说明（无主次之分，完全随机）
- 宗门：宗门内的任务
- 奇遇：偶然触发的机缘
- 日常：可重复的日常任务
- 系统任务：通用系统任务
- 道侣培养：与特定 NPC 的关系发展任务
- 修为提升：修炼突破类任务
- 收集资源：采集/收集物品类任务
- 战斗挑战：战斗/击杀类任务

⚠️ 注意：本游戏没有主线支线之分，所有任务类型平等，一切由玩家自由探索

## 奖励标准（根据境界，参考）
🔥 重要：奖励必须有诱惑力，不能太少！

### 修为奖励参考（单个任务）
- 练气初期：200-500 修为
- 练气中期：500-1200 修为
- 练气后期：1200-2500 修为
- 练气圆满：2500-5000 修为
- 筑基初期：5000-10000 修为
- 筑基中期：10000-20000 修为
- 筑基后期：20000-40000 修为
- 更高境界：按倍数递增

### 灵石奖励参考
- 练气期：下品灵石 50-200
- 筑基期：下品灵石 200-500，或中品灵石 10-50
- 金丹期：中品灵石 50-200，或上品灵石 5-20

## 输出格式（必须严格遵守）
你必须严格按顺序输出：
1) 先输出思维链：<thinking>...</thinking>
2) 再输出 JSON：必须用 \`\`\`json 代码块包裹

JSON 语法要求：
- 必须是纯净 JSON（语法正确、无尾随逗号）
- 所有键必须使用双引号
- 除 <thinking> 标签外，禁止输出任何额外解释性文字

JSON 必须包含字段：
- text: string
- mid_term_memory: string
- tavern_commands: array
- action_options: array

其中 tavern_commands 必须包含 1 条 push：
- action: "push"
- key: "任务系统.当前任务列表"
- value: 完整任务对象

并且 tavern_commands 内每个元素只能包含 3 个字段：action、key、value（禁止添加其它字段）。
action 仅限：set, add, push, pull, delete

## 任务对象字段（value 必须包含）
- 任务ID: string（唯一）
- 任务名称: string
- 任务描述: string
- 任务类型: string（建议从：宗门/奇遇/日常/系统任务/道侣培养/修为提升/收集资源/战斗挑战 中选择）
- 任务状态: string（必须为“进行中”）
- 接取时间: string
- 完成时间: null
- 目标列表: array
- 奖励: object

## 目标对象字段（目标列表每一项必须包含）
- 类型: string
- 目标ID: string
- 描述: string
- 需求数量: number
- 当前进度: number
- 已完成: boolean
`

  const cfg = params.questConfig || {}
  const rawType = cfg.系统任务类型
  const typeText = rawType ? String(rawType) : ''
  const extra = String(cfg.系统任务提示词 || '').trim()

  let prompt = fillTemplate(base, {
    玩家姓名: params.playerName,
    当前境界: params.realmText,
    当前位置: params.locationText
  })

  if (typeText) {
    prompt += `\n\n## 系统任务风格\n当前系统类型：${typeText}\n请严格依据该风格生成任务的主题、目标与奖励。`
  }
  if (extra) {
    prompt += `\n\n## 自定义要求\n${extra}`
  }

  return prompt.trim()
}

export async function runQuestGeneration(params: {
  saveData: SaveData
  preset: AiProviderPreset
  customApiUrl: string
  apiKey: string
  model: string
  temperature: number
  maxOutputTokens: number
  allowPromptOverrides: boolean
  stream?: boolean
}): Promise<{ quest: any; tavern_commands: TavernCommand[]; rawText: string }> {
  const baseUrl = resolveAiBaseUrl({ preset: params.preset, customBaseUrl: params.customApiUrl })
  if (!baseUrl) throw new Error('未配置 AI Base URL')
  if (!params.model) throw new Error('未选择模型')

  const playerName = String((params.saveData as any)?.角色基础信息?.名字 || (params.saveData as any)?.玩家姓名 || '玩家')
  const realm = (params.saveData as any)?.玩家角色状态?.境界
  const realmText = realm ? `${String(realm?.名称 || '')}${String(realm?.阶段 || '')}` : '未知'
  const locationText = String((params.saveData as any)?.玩家角色状态?.位置?.描述 || '未知')

  const systemPrompt = buildQuestSystemPrompt({
    playerName,
    realmText,
    locationText,
    questConfig: (params.saveData as any)?.任务系统?.配置
  })

  const rawText = await chatCompletionText({
    baseUrl,
    apiKey: params.apiKey,
    model: params.model,
    temperature: params.temperature,
    maxTokens: Math.max(16, Math.floor(Number(params.maxOutputTokens) || 0)),
    stream: false,
    stripThinking: false,
    timeoutMs: 180000,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: '生成一个适合当前情况的任务' }
    ]
  })

  const parsed = extractJson(rawText)
  const commands: TavernCommand[] = Array.isArray((parsed as any)?.tavern_commands) ? (parsed as any).tavern_commands : []
  const pushCmd = commands.find((c: any) => c && c.action === 'push' && c.key === '任务系统.当前任务列表')
  const questRaw = (pushCmd as any)?.value ?? (parsed as any)?.quest ?? (parsed as any)?.任务 ?? null
  const quest = normalizeQuest(questRaw, params.saveData)

  const nextCommands = ensurePushCommand(commands, quest)
  return { quest, tavern_commands: nextCommands, rawText }
}
