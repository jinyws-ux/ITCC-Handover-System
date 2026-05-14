import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { api } from '../../api/client'
import { tByLang } from '../../i18n/dictionary'
import type { AdminSummary, Lang, Meta } from '../../types'
import { AdminCreateForm } from './AdminCreateForm'
import { AdminTable } from './AdminTable'

const tabs = ['users', 'groups', 'factories', 'systems', 'shifts'] as const

export function AdminPage({ lang, meta, setMeta }: { lang: Lang; meta: Meta; setMeta: (m: Meta) => void }) {
  const t = tByLang(lang)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [tab, setTab] = useState<(typeof tabs)[number]>('users')
  const [msg, setMsg] = useState('')
  const [forbidden, setForbidden] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  async function load() {
    try {
      setForbidden(false)
      const s = await api<AdminSummary>('/api/admin/summary')
      setSummary(s)
      setMeta(s.meta)
    } catch (e) {
      const text = String(e)
      if (text.includes('403') || text.toLowerCase().includes('forbidden')) setForbidden(true)
      else setMsg(text)
    }
  }
  useEffect(() => { load() }, [])

  async function create(kind: 'users' | 'groups' | 'factories' | 'systems') {
    setMsg('')
    try {
      const m = await api<Meta>(`/api/admin/${kind}`, { method: 'POST', body: JSON.stringify({ ...form, groupId: form.groupId ? Number(form.groupId) : null, factoryId: form.factoryId ? Number(form.factoryId) : null }) })
      setMeta(m)
      setForm({})
      await load()
      setMsg(lang === 'zh' ? '创建成功' : 'Created successfully')
    } catch (e) {
      const text = String(e)
      if (text.includes('403') || text.toLowerCase().includes('forbidden')) setForbidden(true)
      else setMsg(text)
    }
  }

  if (forbidden) return <section className="rounded-3xl border bg-white p-6 text-red-700">{lang === 'zh' ? '无权限访问 Admin 接口，请使用管理员账号。' : 'No permission to access Admin APIs. Please login with an admin account.'}</section>

  return <div className="space-y-5">
    <section className="rounded-[32px] bg-slate-950 p-6 text-white"><div className="flex items-center gap-3"><Settings /><div><h2 className="text-2xl font-black">{t.pages.admin}</h2><p className="text-sm text-slate-300">Users / Groups / Factories / Systems / Shifts</p></div></div></section>
    {summary && <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">{['users', 'groups', 'shifts', 'factories', 'systems', 'tasks', 'schedules'].map(k => <div key={k} className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">{k}</p><p className="mt-2 text-2xl font-black text-slate-900">{summary.counts[k] || 0}</p></div>)}</div>}
    <div className="flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1">{tabs.map(x => <button key={x} onClick={() => setTab(x)} className={`rounded-xl px-4 py-2 font-black ${tab === x ? 'bg-white text-blue-700' : 'text-slate-600'}`}>{({ users: t.adminUsers, groups: t.adminGroups, factories: t.adminFactories, systems: t.adminSystems, shifts: t.adminShifts })[x]}</button>)}</div>
    {msg && <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">{msg}</p>}
    <div className="rounded-3xl border bg-white p-4"><AdminCreateForm tab={tab} lang={lang} meta={meta} form={form} setForm={setForm} onCreate={create} /></div>
    <AdminTable tab={tab} lang={lang} meta={meta} />
  </div>
}
