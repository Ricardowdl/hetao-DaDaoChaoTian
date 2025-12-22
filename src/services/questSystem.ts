import type { TavernCommand } from './tavernCommands'

export function checkQuestObjective(params: {
  state: any
  questId: string
  objectiveType: string
  objectiveId: string
}): { commands: TavernCommand[]; questCompleted: boolean } {
  const questId = String(params.questId || '')
  const objectiveType = String(params.objectiveType || '')
  const objectiveId = String(params.objectiveId || '')

  if (!questId || !objectiveType || !objectiveId) return { commands: [], questCompleted: false }

  const list = params.state?.任务系统?.当前任务列表
  if (!Array.isArray(list)) return { commands: [], questCompleted: false }

  const questIndex = list.findIndex((q: any) => q && String(q.任务ID || '') === questId)
  if (questIndex < 0) return { commands: [], questCompleted: false }

  const quest = list[questIndex]
  const objectives = Array.isArray(quest?.目标列表) ? quest.目标列表 : []
  const objIndex = objectives.findIndex((o: any) => o && String(o.类型 || '') === objectiveType && String(o.目标ID || '') === objectiveId)
  if (objIndex < 0) return { commands: [], questCompleted: false }

  const obj = objectives[objIndex]
  if (obj?.已完成) return { commands: [], questCompleted: false }

  const cur = Math.max(0, Math.floor(Number(obj?.当前进度 ?? 0) || 0))
  const need = Math.max(0, Math.floor(Number(obj?.需求数量 ?? 0) || 0))
  const next = cur + 1

  const commands: TavernCommand[] = []
  commands.push({ action: 'set', key: `任务系统.当前任务列表[${questIndex}].目标列表[${objIndex}].当前进度`, value: next })

  let nowDone = false
  if (need > 0 && next >= need) {
    commands.push({ action: 'set', key: `任务系统.当前任务列表[${questIndex}].目标列表[${objIndex}].已完成`, value: true })
    nowDone = true
  }

  const questCompleted = objectives.every((o: any, i: number) => {
    if (!o || typeof o !== 'object') return true
    if (i === objIndex) {
      if (nowDone) return true
      return need > 0 ? next >= need : true
    }
    const done = !!o.已完成
    if (done) return true
    const c = Math.max(0, Math.floor(Number(o?.当前进度 ?? 0) || 0))
    const n = Math.max(0, Math.floor(Number(o?.需求数量 ?? 0) || 0))
    if (n <= 0) return true
    return c >= n
  })

  return { commands, questCompleted }
}
