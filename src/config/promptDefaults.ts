import promptsAll from '../../prompts_all (1).json'

export type PromptCategoryKey = 'coreRequest' | 'summary' | 'initialization' | 'generation'

export type PromptCategoryInfo = {
  name: string
  description: string
  icon: string
}

export const PROMPT_CATEGORIES: Record<PromptCategoryKey, PromptCategoryInfo> = {
  coreRequest: {
    name: '核心请求提示词',
    description: '正常游戏请求时按顺序发送的提示词',
    icon: '📨'
  },
  summary: {
    name: '总结请求提示词',
    description: '记忆总结时使用的提示词',
    icon: '📝'
  },
  initialization: {
    name: '开局初始化提示词',
    description: '开局时世界生成和角色初始化的提示词',
    icon: '🚀'
  },
  generation: {
    name: '动态生成提示词',
    description: '游戏中动态生成NPC/任务/物品的提示词',
    icon: '🎨'
  }
}

export type PromptKey =
  | 'coreRules'
  | 'businessRules'
  | 'dataDefinitions'
  | 'textFormats'
  | 'worldStandards'
  | 'cotCore'
  | 'actionOptions'
  | 'questSystemRules'
  | 'memorySummary'
  | 'npcMemorySummary'
  | 'worldGeneration'
  | 'characterInit'
  | 'npcGeneration'
  | 'questGeneration'
  | 'itemGeneration'

export type PromptDefinition = {
  key: PromptKey
  name: string
  description: string
  category: PromptCategoryKey
  order: number
  defaultContent: string
}

const PROMPT_META: Array<Omit<PromptDefinition, 'defaultContent'>> = [
  {
    key: 'coreRules',
    name: '1. 核心输出规则',
    description: 'JSON输出格式、响应格式要求、数据结构严格性规则',
    category: 'coreRequest',
    order: 1
  },
  {
    key: 'businessRules',
    name: '2. 业务规则',
    description: '游戏业务逻辑规则、NPC行为规范、战斗修炼规则',
    category: 'coreRequest',
    order: 2
  },
  {
    key: 'dataDefinitions',
    name: '3. 数据结构定义',
    description: '游戏存档数据结构完整定义',
    category: 'coreRequest',
    order: 3
  },
  {
    key: 'textFormats',
    name: '4. 文本格式规范',
    description: '叙事文本格式标记、判定系统、战斗伤害公式',
    category: 'coreRequest',
    order: 4
  },
  {
    key: 'worldStandards',
    name: '5. 世界观标准',
    description: '境界属性标准、品质系统、声望变化指南',
    category: 'coreRequest',
    order: 5
  },
  {
    key: 'cotCore',
    name: '6. CoT思维链',
    description: '强制AI先思考后输出的思维链协议',
    category: 'coreRequest',
    order: 6
  },
  {
    key: 'actionOptions',
    name: '7. 行动选项规则',
    description: '生成玩家行动选项的规范（可选启用）',
    category: 'coreRequest',
    order: 7
  },
  {
    key: 'questSystemRules',
    name: '8. 任务系统规则',
    description: '任务系统开关控制和触发条件（可选启用）',
    category: 'coreRequest',
    order: 8
  },
  {
    key: 'memorySummary',
    name: '记忆总结提示词',
    description: '中期记忆转化为长期记忆时的总结提示词',
    category: 'summary',
    order: 1
  },
  {
    key: 'npcMemorySummary',
    name: 'NPC记忆总结提示词',
    description: 'NPC记忆总结的提示词',
    category: 'summary',
    order: 2
  },
  {
    key: 'worldGeneration',
    name: '1. 世界生成提示词',
    description: '开局第一步：生成修仙世界的大陆、势力、地点等设定',
    category: 'initialization',
    order: 1
  },
  {
    key: 'characterInit',
    name: '2. 角色初始化提示词',
    description: '开局第二步：根据玩家选择生成角色初始状态和开场剧情',
    category: 'initialization',
    order: 2
  },
  {
    key: 'npcGeneration',
    name: 'NPC生成提示词',
    description: '游戏中动态生成NPC角色',
    category: 'generation',
    order: 1
  },
  {
    key: 'questGeneration',
    name: '任务生成提示词',
    description: '游戏中动态生成任务',
    category: 'generation',
    order: 2
  },
  {
    key: 'itemGeneration',
    name: '物品生成提示词',
    description: '游戏中动态生成物品',
    category: 'generation',
    order: 3
  }
]

const DEFAULT_CONTENT_MAP = promptsAll as Record<string, string>

export const DEFAULT_PROMPT_DEFINITIONS: Record<PromptKey, PromptDefinition> = PROMPT_META.reduce(
  (acc, meta) => {
    const base = DEFAULT_CONTENT_MAP[meta.key] || ''
    const patched =
      meta.key === 'itemGeneration'
        ? `# 物品生成（对齐原版背包/使用逻辑）\n\n你是物品生成器。你必须输出【一个完整物品对象】（不是tavern_commands），用于写入 SaveData.背包.物品[物品ID]。\n\n## 0. 原版关键行为（必须遵守）\n- 背包“直接使用”仅允许 类型=其他。\n- 原版 useItem 结算仅依赖：类型/数量/使用效果/描述。不要要求前端解析“效果对象”。\n- 原版背包UI会把非 装备/功法 的所有物品类型都视为 其他；因此你生成可消耗/可使用的物品时，类型必须为 其他。\n\n## 1. 通用字段（必填）\n- 物品ID: string（唯一）\n- 名称: string\n- 类型: \"装备\" | \"功法\" | \"其他\"\n- 品质: {quality: \"凡\"|\"黄\"|\"玄\"|\"地\"|\"天\"|\"仙\"|\"神\", grade: 0-10}\n- 数量: number\n- 描述: string（用于UI展示；当没有使用效果时会用于“效果：...”展示）\n\n## 2. 类型=其他（可直接使用）\n- 使用效果?: string（可选，但强烈建议提供；用于“效果：...”展示）\n\n## 3. 类型=装备\n- 已装备: boolean\n- 装备增幅?: object\n\n## 4. 类型=功法\n- 功法效果: string\n- 功法技能: array\n- 修炼进度: number (0-100)\n- 已解锁技能: array\n- 已装备: boolean\n\n## 5. 输出要求\n- 仅输出一个JSON对象（不要Markdown、不要解释文字）。\n- 严禁输出 类型=丹药/材料/杂物（原版会归类为其他，但这里必须直接生成其他）。\n`
        : meta.key === 'businessRules'
          ? `${base}\n\n---\n\n# 变量更新强制规则（对齐反混淆new.js，最高优先级）\n\n## 核心原则\n**text描写了什么，tavern_commands就必须更新什么。描写与数据必须100%同步。**\n\n## 必须更新的场景\n\n### 战斗/修炼\n- **消耗**: 使用技能/法术 → add 玩家角色状态.灵气.当前（负数）\n- **受伤**: 受到伤害 → add 玩家角色状态.气血.当前（负数） + push 玩家角色状态.状态效果（受伤debuff）\n- **修炼**: 修炼功法/深度修炼 → **add 背包.物品.<功法ID>.修炼进度** + **add 玩家角色状态.境界.当前进度**（正数，必须出现，否则修为进度不会变化）\n\n### 时间推进\n- **任何行动**: 必须推进时间 → add 游戏时间.分钟\n`
        : meta.key === 'dataDefinitions'
          ? `${base}\n\n---\n\n# 【补充说明】\n- 原版背包UI的“使用”按钮仅对 类型=其他 开放，因此可直接使用的丹药/消耗品建议也归类为 类型=其他。`
          : base
    acc[meta.key] = {
      ...meta,
      defaultContent: patched
    }
    return acc
  },
  {} as Record<PromptKey, PromptDefinition>
)

export function getDefaultPromptContent(key: PromptKey): string {
  return DEFAULT_PROMPT_DEFINITIONS[key]?.defaultContent || ''
}
