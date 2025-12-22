export function formatRelativeTime(iso: string | null | undefined) {
  if (!iso) return '未知'
  const t = new Date(iso)
  if (!Number.isFinite(t.getTime())) return '未知'
  const diff = Date.now() - t.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}秒前`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}小时前`
  const day = Math.floor(hour / 24)
  return `${day}天前`
}
