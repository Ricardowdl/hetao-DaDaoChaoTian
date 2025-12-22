import { chatCompletionText } from './aiClient'
import { resolveAiBaseUrl } from './aiProviders'

import type { SaveData } from '../stores/useGameStateStore'
import type { TavernCommand } from './tavernCommands'
import type { AiProviderPreset } from '../stores/useSettingsStore'

function extractJson(text: string) {
  if (!text || typeof text !== 'string') {
    throw new Error('AI响应为空或格式错误')
  }

  const trimmed = text.trim()

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    return JSON.parse(fenced[1].trim())
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    void 0
  }

  const firstBrace = trimmed.indexOf('{')
  if (firstBrace !== -1) {
    const m = trimmed.substring(firstBrace).match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  }

  throw new Error('无法解析AI响应为有效的JSON格式')
}

function getGameTimeTextFromSave(saveData: any) {
  const t: any = saveData?.游戏时间
  if (!t) return '未知时间'
  const y = Number(t.年)
  const m = Number(t.月)
  const d = Number(t.日)
  const hh = Number(t.小时)
  const mm = Number(t.分钟)
  if (![y, m, d, hh, mm].every(Number.isFinite)) return '未知时间'
  return `仙道${Math.floor(y)}年${Math.floor(m)}月${Math.floor(d)}日 ${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor(mm)).padStart(2, '0')}`
}

function buildQuestFinishPrompt(params: { quest: any; saveData: SaveData }) {
  const q = params.quest || {}
  const rewardCultivation = Number(q?.奖励?.修为 ?? 0) || 0
  const rewardStone = Number(q?.奖励?.灵石?.下品 ?? 0) || 0
  const timeText = getGameTimeTextFromSave(params.saveData)

  const questJson = JSON.stringify(q, null, 2)

  return (
    `\n# 任务完成系统\n\n## 完成的任务\n${questJson}\n\n## 发放奖励\n根据任务奖励配置，使用 tavern_commands 发放：\n\n` +
    '```json\n' +
    '{\n' +
    '  "text": "任务完成的庆祝描述和奖励发放场景（200-300字）",\n' +
    '  "tavern_commands": [\n' +
    '    {"action":"set","key":"任务系统.当前任务列表.0.任务状态","value":"已完成"},\n' +
    `    {"action":"set","key":"任务系统.当前任务列表.0.完成时间","value":"${timeText}"},\n` +
    `    {"action":"add","key":"玩家角色状态.境界.当前进度","value":${rewardCultivation}},\n` +
    `    {"action":"add","key":"背包.灵石.下品","value":${rewardStone}},\n` +
    '    {"action":"add","key":"任务系统.任务统计.完成总数","value":1}\n' +
    '  ]\n' +
    '}\n' +
    '```\n\n' +
    '## 奖励类型说明\n' +
    '- 修为: add 玩家角色状态.境界.当前进度\n' +
    '- 灵石: add 背包.灵石.{品级}\n' +
    '- 物品: set 背包.物品.{物品ID} 为完整物品对象\n' +
    '- 声望: add 玩家角色状态.声望\n' +
    '- 属性加成: add 角色基础信息.后天六司.{属性}\n' +
    '- 好感度: add 人物关系.{NPC名称}.好感度\n' +
    '\n输出要求：必须用 ```json 代码块包裹；tavern_commands 数组元素只能包含 action/key/value；action 仅限 set/add。'
  )
}

export async function runQuestCompletion(params: {
  saveData: SaveData
  quest: any
  preset: AiProviderPreset
  customApiUrl: string
  apiKey: string
  model: string
  temperature: number
  maxOutputTokens: number
  allowPromptOverrides: boolean
  stream?: boolean
}): Promise<{ text: string; tavern_commands: TavernCommand[]; rawText: string }> {
  const baseUrl = resolveAiBaseUrl({ preset: params.preset, customBaseUrl: params.customApiUrl })
  if (!baseUrl) throw new Error('未配置 AI Base URL')
  if (!params.model) throw new Error('未选择模型')

  const systemPrompt = buildQuestFinishPrompt({ quest: params.quest, saveData: params.saveData })

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
      { role: 'user' as const, content: '完成任务' }
    ]
  })

  const parsed = extractJson(rawText)
  const cmdsRaw: any[] = Array.isArray((parsed as any)?.tavern_commands) ? (parsed as any).tavern_commands : []
  const cmds: TavernCommand[] = cmdsRaw
    .filter((c: any) => {
      if (!c || (c.action !== 'set' && c.action !== 'add')) return false
      if (typeof c.key !== 'string') return false
      // 原版最终会自行设置任务状态/完成时间/统计；此处避免 AI 用错误索引污染任务列表
      if (c.key.startsWith('任务系统.')) return false
      return true
    })
    .map((c: any) => ({ action: c.action, key: c.key, value: c.value } as TavernCommand))

  const text = typeof (parsed as any)?.text === 'string' ? (parsed as any).text : ''
  return { text, tavern_commands: cmds, rawText }
}
