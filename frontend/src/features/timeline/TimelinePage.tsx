import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { api } from '../../api/client'
import { tByLang } from '../../i18n/dictionary'
import { jp, priCls, statusCls } from '../../utils/labels'
import { timeFmt } from '../../utils/date'
import type { Lang, Task, TimelineRich } from '../../types'

type Props = { lang: Lang; open: (t: Task) => void }

export function TimelinePage({ lang, open }: Props) {
  const t = tByLang(lang)
  const [data, setData] = useState<TimelineRich>({ items: [], events: [], total: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  async function load() {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (type) p.set('type', type)
    if (status) p.set('status', status)
    if (priority) p.set('priority', priority)
    const res = await api<TimelineRich>(`/api/timeline-rich-v2?${p}`)
    setData({ ...res, events: [...res.events].sort((a, b) => String(b.eventTime).localeCompare(String(a.eventTime))) })
  }
  useEffect(() => { load() }, [])

  return <div className='space-y-5'>
    <section className='rounded-[32px] bg-slate-950 p-6 text-white'><h2 className='text-3xl font-black'>{t.richTimeline}</h2></section>
    <section className='grid gap-3 md:grid-cols-4'>{[['TASKs', data.items.length], ['Events', data.events.length], ['Hypercare', data.events.filter(e => (e.logType || '').toLowerCase().includes('hypercare')).length], ['External', data.events.filter(e => e.externalLinks.length > 0).length]].map(([k, v]) => <div key={String(k)} className='rounded-2xl border bg-white p-4'><p className='text-xs font-black text-slate-500'>{k}</p><p className='mt-2 text-2xl font-black'>{v}</p></div>)}</section>
    <section className='rounded-3xl border bg-white p-4'><div className='mb-3 flex items-center justify-between'><p className='text-sm text-slate-500'>{t.filters}</p><button onClick={() => setShowFilters(v => !v)} className='rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold'>{showFilters ? 'Collapse' : 'Expand'}</button></div>{showFilters && <div className='grid gap-3 lg:grid-cols-5'><input className='input' value={q} onChange={e => setQ(e.target.value)} placeholder='keyword' /><input className='input' value={type} onChange={e => setType(e.target.value)} placeholder='type' /><input className='input' value={status} onChange={e => setStatus(e.target.value)} placeholder='status' /><input className='input' value={priority} onChange={e => setPriority(e.target.value)} placeholder='priority' /><button onClick={load} className='rounded-2xl bg-blue-600 px-4 py-3 font-black text-white'>{t.apply}</button></div>}</section>
    <section className='rounded-[32px] border bg-white p-5 shadow-sm'><div className='space-y-4'>{data.events.map((ev, index) => <div key={`${ev.eventTime}-${ev.task.id}-${index}`} className='grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[180px_1fr]'><div><p className='text-sm font-black'>{timeFmt(ev.eventTime)}</p><p className='mt-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700'>{jp(lang, ev.logType || ev.eventType || 'Event')}</p></div><div><div className='flex flex-wrap items-center gap-2'><button onClick={() => open(ev.task)} className='font-black text-blue-700 hover:underline'>{ev.task.taskNo}</button><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusCls(ev.task.status)}`}>{jp(lang, ev.task.status)}</span><span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${priCls(ev.task.priority)}`}>{jp(lang, ev.task.priority)}</span><span className='text-xs font-bold text-slate-500'>{ev.task.type} · {ev.task.system}</span></div><h3 className='mt-2 font-black'>{ev.task.title}</h3><p className='mt-1 text-sm text-slate-600'>{ev.content || ev.task.nextAction}</p>{ev.externalLinks.length > 0 && <div className='mt-2 flex flex-wrap gap-2'>{ev.externalLinks.map((x, i) => <span key={`${x.type}-${i}`} className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700'><ExternalLink className='h-3 w-3' />{x.type}:{x.id || x.title || '-'}</span>)}</div>}</div></div>)}</div></section>
  </div>
}
