export function getItemTypeIcon(type: string, item?: any): string {
  const t = String(type || item?.类型 || '').trim()

  const baseMap: Record<string, string> = {
    装备: '⚔️',
    功法: '📜',
    丹药: '💊',
    材料: '🧱',
    法宝: '🔮',
    符箓: '🧿',
    灵石: '💎',
    其他: '📦'
  }

  if (t && baseMap[t]) return baseMap[t]

  const name = String(item?.名称 || item?.name || '')
  const desc = String(item?.描述 || item?.desc || '')
  const hay = `${t} ${name} ${desc}`

  if (/丹|药|丸|散|汤|膏|恢复|疗伤/.test(hay)) return baseMap.丹药
  if (/功法|秘法|法诀|心法|剑诀|经/.test(hay)) return baseMap.功法
  if (/符|符箓|符咒|符纸/.test(hay)) return baseMap.符箓
  if (/法宝|灵器|宝器|飞剑|法器|阵盘/.test(hay)) return baseMap.法宝
  if (/甲|衣|袍|靴|盔|冠|戒|链|武器|刀|剑|枪|弓|盾/.test(hay)) return baseMap.装备
  if (/石|矿|草|木|皮|骨|羽|血|晶|砂|粉|材料/.test(hay)) return baseMap.材料
  if (/灵石/.test(hay)) return baseMap.灵石

  return baseMap.其他
}
