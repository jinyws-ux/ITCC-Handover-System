const pad = (n: number) => String(n).padStart(2, '0')

export const ym = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const addMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number)
  let ny = y
  let nm = m + delta
  while (nm > 12) { nm -= 12; ny += 1 }
  while (nm < 1) { nm += 12; ny -= 1 }
  return `${ny}-${pad(nm)}`
}

export const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function monthRangeFromToday(month: string, includePastCurrentMonth = false) {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const now = new Date()
  const sameMonth = y === now.getFullYear() && m === now.getMonth() + 1
  const start = sameMonth && !includePastCurrentMonth ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : first
  const days: Date[] = []
  for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) days.push(new Date(d))
  return days
}

export const timeFmt = (s: string) => (s || '').replace('T', ' ').slice(0, 16)
