import { useEffect, useState } from 'react'
import { tByLang } from '../../i18n/dictionary'
import { addMonth, fmt, monthRangeFromToday, todayStr, ym } from '../../utils/date'
import { confirmScheduleImport, createSchedule, deleteSchedule, getCalendarRich, patchSchedule } from '../../api/schedules'
import type { CalendarRich, Lang, Meta, Schedule, Task } from '../../types'
import { emptyCal } from '../../types'

type Props = { lang: Lang; meta: Meta; canManageSchedule: boolean; openTask: (task: Task) => void }

export function CalendarPage({ lang, meta: _meta, canManageSchedule, openTask }: Props) {
  const t = tByLang(lang)
  const [month, setMonth] = useState(ym())
  const [showPast, setShowPast] = useState(false)
  const [payload, setPayload] = useState<CalendarRich>(emptyCal)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ workDate: todayStr(), shiftId: '', groupId: '', startTime: '', endTime: '', members: '', remark: '' })
  const isCurrentMonth = month === ym()
  async function load(m = month) { setPayload(await getCalendarRich(m)) }
  useEffect(() => { load(month) }, [month])
  async function createOne(e: React.FormEvent) { e.preventDefault(); if (!canManageSchedule) return; try { await createSchedule({ ...form, shiftId: Number(form.shiftId), groupId: Number(form.groupId) }); await load(month); setMsg('OK') } catch (err) { setMsg(String(err)) } }
  async function runPreview() { if (!file) return; const fd = new FormData(); fd.append('month', month); fd.append('file', file); const r = await fetch('/api/admin/schedules/import-preview', { method: 'POST', credentials: 'include', body: fd }); setPreview(await r.json()) }
  async function doImport() { if (!preview) return; await confirmScheduleImport({ month, overwrite: true, items: preview.schedules || [] }); setPreview(null); setShowImport(false); await load(month) }
  async function editSchedule(s: Schedule) { if (!canManageSchedule) return; const members = prompt('members', s.members) ?? s.members; await patchSchedule(s.id, { members, startTime: s.startTime, endTime: s.endTime, remark: s.remark }); await load(month) }
  async function removeSchedule(s: Schedule) { if (!canManageSchedule) return; await deleteSchedule(s.id); await load(month) }
  const days = monthRangeFromToday(month, showPast)

  return <div className='space-y-5'>
    <section className='rounded-[32px] bg-slate-950 p-6 text-white'><div className='flex flex-wrap gap-2'><button onClick={() => setMonth(addMonth(month, -1))}>{t.prevMonth}</button><input type='month' value={month} onChange={e => setMonth(e.target.value)} /><button onClick={() => setMonth(ym())}>{t.thisMonth}</button><button onClick={() => setMonth(addMonth(month, 1))}>{t.nextMonth}</button>{isCurrentMonth && <button onClick={() => setShowPast(v => !v)}>{showPast ? 'Hide Past Days' : 'Show Past Days'}</button>}</div></section>
    <section className='rounded-3xl border bg-white p-4'>
      {!canManageSchedule && <p>{lang === 'zh' ? '仅管理员可维护排班' : 'Only admin can maintain schedules'}</p>}
      {canManageSchedule && <><button onClick={() => setShowForm(v => !v)}>{showForm ? 'Collapse Form' : 'Expand Form'}</button><button onClick={() => setShowImport(v => !v)}>Excel Import</button></>}
      {showImport && canManageSchedule && <div><input type='file' onChange={e => setFile(e.target.files?.[0] || null)} /><button onClick={runPreview}>Preview</button>{preview && <button onClick={doImport}>Confirm</button>}</div>}
      {showForm && <form onSubmit={createOne}><input type='date' value={form.workDate} onChange={e => setForm({ ...form, workDate: e.target.value })} /><button>{t.create}</button></form>}
      {msg && <p>{msg}</p>}
    </section>
    <section className='grid gap-3'>{days.map(d => { const key = fmt(d); const day = payload.byDate[key] || { schedules: [], hypercare: [] }; return <div key={key} className='rounded-3xl border bg-white p-4'><p>{key}</p><div className='grid md:grid-cols-2 gap-2'>{day.schedules.map(s => <div key={s.id} className='rounded bg-slate-50 p-2 text-xs'><p>{s.shift} {s.startTime}-{s.endTime}</p><p>{s.members}</p>{canManageSchedule && <><button onClick={() => editSchedule(s)}>Edit</button><button onClick={() => removeSchedule(s)}>Delete</button></>}</div>)}{day.hypercare.map(h => <button key={h.id} onClick={() => h.taskId && openTask({ id: h.taskId, taskNo: h.taskNo || '-', title: h.title || 'Hypercare', type: 'Hypercare', priority: 'None', status: h.status || 'Open', handoverCategory: 'Monitoring', factory: h.factory || '-', system: h.system || '-', source: 'Manual', targetShift: '-', targetGroup: '-', nextAction: h.checkItem, externalLinks: [], isED1: false, updatedAt: `${h.date} ${h.time}` })} className='rounded border-2 border-emerald-300 bg-emerald-50 p-2 text-left text-xs'><p>{h.time} {h.taskNo}</p><p>{h.title}</p></button>)}</div></div> })}</section>
  </div>
}
