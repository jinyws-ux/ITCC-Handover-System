export const ym = () => new Date().toISOString().slice(0, 7)
export const todayStr = () => new Date().toISOString().slice(0, 10)
export const addMonth = (month: string, delta: number) => { const [y, m] = month.split('-').map(Number); const d = new Date(y, m - 1 + delta, 1); return d.toISOString().slice(0, 7) }
export const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function monthRangeFromToday(month: string) { const [y, m] = month.split('-').map(Number); const first = new Date(y, m - 1, 1); const last = new Date(y, m, 0); const now = new Date(); const start = month === ym() ? now : first; const days: Date[] = []; for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= last; d.setDate(d.getDate() + 1)) days.push(new Date(d)); return days }
export const timeFmt = (s: string) => (s || '').replace('T', ' ').slice(0, 16)
