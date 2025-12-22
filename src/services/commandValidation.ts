import type { TavernCommand } from './tavernCommands'

type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

type CommandsValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
  invalidCommands: Array<{ command: TavernCommand; errors: string[] }>
}

function validateValueType(key: string, value: any, action: string): string[] {
  const errors: string[] = []
  
  try {
    const sixAttributes = ['根骨', '灵性', '悟性', '气运', '魅力', '心性']
    
    // add操作数值类型检查
    if (action === 'add') {
      const numericPaths = [
        '游戏时间.年', '游戏时间.月', '游戏时间.日', '游戏时间.小时', '游戏时间.分钟',
        '玩家角色状态.声望',
        '玩家角色状态.气血.当前', '玩家角色状态.气血.上限',
        '玩家角色状态.灵气.当前', '玩家角色状态.灵气.上限',
        '玩家角色状态.神识.当前', '玩家角色状态.神识.上限',
        '玩家角色状态.寿命.当前', '玩家角色状态.寿命.上限',
        '背包.灵石.下品', '背包.灵石.中品', '背包.灵石.上品', '背包.灵石.极品',
        '宗门信息.贡献', '宗门信息.声望'
      ]
      
      if (numericPaths.some(p => key === p || key.endsWith('.' + p.split('.').pop())) && typeof value !== 'number') {
        errors.push(`${key}使用add操作时value必须是数字，当前类型: ${typeof value}`)
      }
      
      // 后天六司检查
      if ((key.startsWith('角色基础信息.后天六司.') || key.includes('.后天六司.')) &&
          sixAttributes.some(attr => key.endsWith('.' + attr)) && typeof value !== 'number') {
        errors.push(`${key}使用add操作时value必须是数字，当前类型: ${typeof value}`)
      }
    }
    
    // 境界对象检查
    if (key === '玩家角色状态.境界' && action === 'set') {
      if (typeof value !== 'object' || value === null) {
        errors.push('境界必须是对象类型')
      } else {
        if (value.名称 !== undefined && typeof value.名称 !== 'string') {
          errors.push('境界.名称必须是字符串类型')
        }
        if (value.阶段 !== undefined && typeof value.阶段 !== 'string') {
          errors.push('境界.阶段必须是字符串类型')
        }
        if (value.当前进度 !== undefined && typeof value.当前进度 !== 'number') {
          errors.push('境界.当前进度必须是数字类型')
        }
        if (value.下一级所需 !== undefined && typeof value.下一级所需 !== 'number') {
          errors.push('境界.下一级所需必须是数字类型')
        }
        if (value.突破描述 !== undefined && typeof value.突破描述 !== 'string') {
          errors.push('境界.突破描述必须是字符串类型')
        }
      }
    }
    
    // 位置对象检查
    if (key === '玩家角色状态.位置' && action === 'set') {
      if (typeof value !== 'object' || value === null) {
        errors.push('位置必须是对象类型')
      } else {
        if (value.描述 !== undefined && typeof value.描述 !== 'string') {
          errors.push('位置.描述必须是字符串类型')
        }
        if (value.x !== undefined && typeof value.x !== 'number') {
          errors.push('位置.x必须是数字类型')
        }
        if (value.y !== undefined && typeof value.y !== 'number') {
          errors.push('位置.y必须是数字类型')
        }
      }
    }
    
    // 状态效果检查
    if (key === '玩家角色状态.状态效果' && action === 'push') {
      if (typeof value !== 'object' || value === null) {
        errors.push('状态效果必须是对象类型')
      } else {
        if (value.类型 !== undefined && !['buff', 'debuff'].includes(value.类型)) {
          errors.push(`状态效果类型必须是"buff"或"debuff"，当前值: ${value.类型}`)
        }
        if (value.持续时间分钟 !== undefined && typeof value.持续时间分钟 !== 'number') {
          errors.push('状态效果.持续时间分钟必须是数字类型')
        }
      }
    }
    
    // 背包物品检查
    if (key === '背包.物品' && action === 'push') {
      if (typeof value !== 'object' || value === null) {
        errors.push('推送到 背包.物品 的物品必须是对象类型')
      }
    }
    
    // 物品set检查
    if (key.startsWith('背包.物品.') && action === 'set' && !key.includes('.数量') && !key.includes('.修炼进度')) {
      if (typeof value !== 'object' || value === null) {
        errors.push('物品必须是对象类型')
      } else if (value.类型 === '功法' && value.功法技能) {
        if (Array.isArray(value.功法技能)) {
          value.功法技能.forEach((skill: any, idx: number) => {
            if (typeof skill !== 'object' || skill === null) {
              errors.push(`功法技能[${idx}]必须是对象类型`)
            }
          })
        } else {
          errors.push('功法物品的功法技能必须是数组类型')
        }
      }
    }
    
    // NPC创建检查
    if (key.startsWith('人物关系.') && (key.match(/\./g) || []).length === 1 && action === 'set' && typeof value === 'object' && value !== null) {
      if (value.境界) {
        if (typeof value.境界 !== 'object' || value.境界 === null) {
          errors.push('NPC境界必须是对象类型')
        } else {
          if (value.境界.名称 !== undefined && typeof value.境界.名称 !== 'string') {
            errors.push('NPC境界.名称必须是字符串类型')
          }
          if (value.境界.阶段 !== undefined && typeof value.境界.阶段 !== 'string') {
            errors.push('NPC境界.阶段必须是字符串类型')
          }
        }
      }
      if (value.天赋 !== undefined && !Array.isArray(value.天赋)) {
        errors.push('NPC天赋必须是数组类型')
      }
      if (value.私密信息) {
        if (typeof value.私密信息 !== 'object' || value.私密信息 === null) {
          errors.push('NPC私密信息必须是对象类型')
        } else if (value.私密信息.身体部位 !== undefined && !Array.isArray(value.私密信息.身体部位)) {
          errors.push('NPC私密信息.身体部位必须是数组类型')
        }
      }
    }
    
    // NPC境界更新检查
    if (key.includes('人物关系.') && key.endsWith('.境界') && action === 'set') {
      if (typeof value !== 'object' || value === null) {
        errors.push('NPC境界必须是对象类型')
      } else {
        if (value.名称 !== undefined && typeof value.名称 !== 'string') {
          errors.push('NPC境界.名称必须是字符串类型')
        }
        if (value.阶段 !== undefined && typeof value.阶段 !== 'string') {
          errors.push('NPC境界.阶段必须是字符串类型')
        }
      }
    }
    
    // 大道检查
    if (key.startsWith('三千大道.大道列表.') && action === 'set' && (key.match(/\./g) || []).length === 2) {
      if (typeof value !== 'object' || value === null) {
        errors.push('大道对象必须是对象类型')
      } else if (value.阶段列表 !== undefined && !Array.isArray(value.阶段列表)) {
        errors.push('大道.阶段列表必须是数组类型')
      }
    }
    
    // 任务检查
    if (key === '任务系统.当前任务列表' && action === 'push') {
      if (typeof value !== 'object' || value === null) {
        errors.push('任务对象必须是对象类型')
      }
    }
    
    return errors
  } catch (e) {
    console.error('[指令验证] validateValueType发生异常:', e)
    errors.push(`验证过程发生异常: ${e instanceof Error ? e.message : String(e)}`)
    return errors
  }
}

function validateCommand(cmd: any, index: number): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    if (!cmd || typeof cmd !== 'object') {
      errors.push(`指令${index}: 不是有效的对象`)
      return { valid: false, errors, warnings }
    }
    
    if (!cmd.action) {
      errors.push(`指令${index}: 缺少action字段`)
    }
    if (!cmd.key) {
      errors.push(`指令${index}: 缺少key字段`)
    }
    
    const validActions = ['set', 'add', 'push', 'delete', 'pull']
    if (cmd.action && !validActions.includes(cmd.action)) {
      errors.push(`指令${index}: action值"${cmd.action}"无效，必须是: ${validActions.join(', ')}`)
    }
    
    if (cmd.key && typeof cmd.key !== 'string') {
      errors.push(`指令${index}: key必须是字符串类型`)
    }
    
    if (cmd.action !== 'delete' && cmd.value === undefined) {
      errors.push(`指令${index}: ${cmd.action}操作必须提供value字段`)
    }
    
    // 检查多余字段
    const allowedFields = ['action', 'key', 'value']
    const extraFields = Object.keys(cmd).filter(k => !allowedFields.includes(k))
    if (extraFields.length > 0) {
      warnings.push(`指令${index}: 包含多余字段: ${extraFields.join(', ')}（这些字段会被自动移除）`)
    }
    
    // 值类型验证
    if (cmd.key && cmd.value !== undefined) {
      try {
        const typeErrors = validateValueType(cmd.key, cmd.value, cmd.action)
        errors.push(...typeErrors.map(e => `指令${index}: ${e}`))
      } catch (e) {
        console.error('[指令验证] 值类型检查异常:', e)
        warnings.push(`指令${index}: 值类型检查时发生异常，已跳过`)
      }
    }
    
    return { valid: errors.length === 0, errors, warnings }
  } catch (e) {
    console.error('[指令验证] validateCommand发生严重异常:', e)
    errors.push(`指令${index}: 验证过程发生严重异常`)
    return { valid: false, errors, warnings }
  }
}

export function validateCommands(commands: any): CommandsValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []
  const invalidCommands: Array<{ command: TavernCommand; errors: string[] }> = []
  
  try {
    if (!Array.isArray(commands)) {
      return {
        valid: false,
        errors: ['tavern_commands必须是数组类型'],
        warnings: [],
        invalidCommands: []
      }
    }
    
    commands.forEach((cmd, index) => {
      try {
        const result = validateCommand(cmd, index)
        allErrors.push(...result.errors)
        allWarnings.push(...result.warnings)
        
        if (result.errors.length > 0) {
          invalidCommands.push({ command: cmd, errors: result.errors })
        }
      } catch (e) {
        console.error(`[指令验证] 验证指令${index}时发生异常:`, e)
        allErrors.push(`指令${index}: 验证时发生异常`)
        allWarnings.push(`指令${index}: 已跳过异常指令`)
      }
    })
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      invalidCommands
    }
  } catch (e) {
    console.error('[指令验证] validateCommands发生严重异常:', e)
    return {
      valid: false,
      errors: ['指令数组验证过程发生严重异常'],
      warnings: [],
      invalidCommands: []
    }
  }
}

export function cleanCommand(cmd: TavernCommand): TavernCommand {
  const cleaned: TavernCommand = {
    action: cmd.action,
    key: cmd.key,
    value: cmd.value
  }
  
  if (cmd.action === 'delete') {
    delete (cleaned as any).value
  }
  
  return cleaned
}

export function cleanCommands(commands: TavernCommand[]): TavernCommand[] {
  return commands.map(cleanCommand)
}

export function preprocessCommands(commands: any[]): TavernCommand[] {
  if (!Array.isArray(commands)) return []
  
  return commands.map(cmd => {
    if (cmd && typeof cmd === 'object' && cmd.action === 'push' && cmd.key === '背包.物品') {
      const value = (cmd as any).value
      if (typeof value === 'string') {
        console.warn(`[AI双向系统] 预处理: 将字符串物品 "${value}" 转换为 set 背包.物品.{物品ID}。`)
        const itemName = value
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        return {
          action: 'set',
          key: `背包.物品.${itemId}`,
          value: {
            物品ID: itemId,
            名称: itemName,
            类型: '其他',
            品质: { quality: '凡', grade: 1 },
            数量: 1,
            描述: `一个普通的${itemName}。`
          }
        } as TavernCommand
      }

      if (value && typeof value === 'object') {
        const itemId = String((value as any).物品ID || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
        return {
          action: 'set',
          key: `背包.物品.${itemId}`,
          value: { ...value, 物品ID: itemId }
        } as TavernCommand
      }
    }
    return cmd
  })
}
