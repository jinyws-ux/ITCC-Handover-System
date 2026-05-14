import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, ExternalLink, ListChecks, LogOut, MonitorDot, Search, ShieldAlert, UserCircle } from 'lucide-react'

type User = { id: number; username: string; displayName: string; email: string; role: string; group: string }

type Task = {
  id: number
  taskNo: string
  title: string
  type: string
  priority: string
  status: string
  handoverCategory: string
  factory: string
  system: string
  source: string
  targetShift: string
  targetGroup: string
  nextAction: string
  externalLinks: string[]
  isED1: boolean
  updatedAt: string
}

type TaskDetail = Task & {
  description: string
  externalLinkDetails: { id: number; type: string; externalId: string; title: string; url: string; status: string; remark: string }[]
  logs: { id: number; type: string; content: string; createdAt: string }[]
  handovers: { id: number; fromShift: string; toShift: string; note: string; status: string; handedOverAt: string; acknowledgedAt: string | null; acceptedAt: string | null }[]
  hypercareChecks: { id: number; checkTime: string; checkItem: string; expectedResult: string; status: string }[]
}

type DashboardData = {
  currentDate: string
  currentShift: { code: string; time: string; group: string }
  nextShift: { code: string; time: string; group: string }
  sections: {
    waitingNextShift: Task[]
    monitoring: Task[]
    noticeOnly: Task[]
    todayHypercare: Task[]
    needConfirmation: Task[]
    recentlyUpdated: Task[]
  }
}

type Page = 'handover' | 'timeline' | 'calendar' | 'admin'

const emptyDashboard: DashboardData = {
  currentDate: '2026-05-14',
  currentShift: { code: 'D2', time: '09:30 - 18:00', group: 'Group B' },
  nextShift: { code: 'E', time: '17:00 - 03:00', group: 'Group C' },
  sections: { waitingNextShift: [], monitoring: [], noticeOnly: [], todayHypercare: [], needConfirmation: [], recentlyUpdated: [] },
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

function priorityBadge(priority: string) {
  if (priority === 'Critical') return 'bg-red-500 text-white'
  if (priority === 'High') return 'bg-orange-500 text-white'
  if (priority === 'Medium') return 'bg-amber-400 text-slate-950'
  if (priority === 'Low') return 'bg-sky-500 text-white'
  return 'bg-slate-200 text-slate-700'
}

function statusBadge(status: string) {
  if (status === 'Monitoring') return 'bg-cyan-100 text-cyan-700 border-cyan-200'
  if (status === 'Waiting Next Shift') return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  if (status === 'Closed') return 'bg-slate-100 text-slate-500 border-slate-200'
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await api<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      onLogin(data.user)
    } catch {
      setError('Login failed. Use admin/admin123, lead/lead123, or user/user123.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bg-[radial-gradient(circle_at_20%_10%,#38bdf8,transparent_28%),linear-gradient(135deg,#020617,#0f172a)] p-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-200">ITCC</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Operations Handover Center</h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">A single place to track Helix, Jira, Outlook, AG tickets, Hypercare, and shift handover actions.</p>
            <div className="mt-10 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">E to D1 non-face-to-face handover</div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">External system aggregation</div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Timeline and schedule tracking</div>
            </div>
          </section>
          <form onSubmit={submit} className="p-8 text-slate-950 lg:p-10">
            <h2 className="text-3xl font-black">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Demo prototype account is prefilled.</p>
            <label className="mt-8 block text-sm font-bold text-slate-700">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
            <label className="mt-5 block text-sm font-bold text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
            {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">Login</button>
            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Accounts: admin/admin123 · lead/lead123 · user/user123</p>
          </form>
        </div>
      </div>
    </main>
  )
}

function Header({ user, page, setPage, onLogout }: { user: User; page: Page; setPage: (page: Page) => void; onLogout: () => void }) {
  const items: { key: Page; label: string }[] = [
    { key: 'handover', label: 'Handover' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'admin', label: 'Admin' },
  ]
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg">IT</div>
            <div>
              <h1 className="text-xl font-black text-slate-950">ITCC Handover</h1>
              <p className="text-xs text-slate-500">Shift operations control center</p>
            </div>
          </div>
          <button onClick={onLogout} className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 xl:hidden">Logout</button>
        </div>
        <nav className="flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {items.map((item) => (
            <button key={item.key} onClick={() => setPage(item.key)} className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition ${page === item.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}>{item.label}</button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white xl:flex">
          <UserCircle className="h-5 w-5 text-slate-300" />
          <div>
            <p className="text-sm font-bold">{user.displayName}</p>
            <p className="text-xs text-slate-400">{user.group} · {user.role}</p>
          </div>
          <button onClick={onLogout} className="ml-2 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    </header>
  )
}

function Hero({ data }: { data: DashboardData }) {
  return (
    <section className="rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1fr_420px] xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-300">{data.currentDate}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight lg:text-5xl">Shift Handover Dashboard</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Focus on what the next shift must know, do, or keep monitoring. Every TASK can link Helix, Jira, Outlook, AG, and Hypercare information.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ShiftBox label="Current" code={data.currentShift.code} time={data.currentShift.time} group={data.currentShift.group} />
          <ShiftBox label="Next" code={data.nextShift.code} time={data.nextShift.time} group={data.nextShift.group} active />
        </div>
      </div>
    </section>
  )
}

function ShiftBox({ label, code, time, group, active }: { label: string; code: string; time: string; group: string; active?: boolean }) {
  return <div className={`rounded-3xl border p-4 ${active ? 'border-blue-300/40 bg-blue-500/20' : 'border-white/10 bg-white/10'}`}><p className="text-xs text-slate-300">{label} shift</p><p className="mt-1 text-lg font-black">{code}</p><p className="text-sm text-slate-300">{time}</p><p className="mt-1 text-xs text-slate-400">{group}</p></div>
}

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-500">{label}</p><div className={`rounded-2xl p-2.5 ${color}`}>{icon}</div></div><p className="mt-4 text-3xl font-black text-slate-950">{value}</p></div>
}

function TaskCard({ task, openTask }: { task: Task; openTask: (task: Task) => void }) {
  return (
    <article className={`rounded-3xl border bg-white p-5 shadow-sm ${task.isED1 ? 'border-orange-300 ring-4 ring-orange-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">{task.taskNo}</span>
            <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{task.type}</span>
            <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${priorityBadge(task.priority)}`}>{task.priority}</span>
            {task.isED1 && <span className="rounded-xl bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">E to D1</span>}
          </div>
          <h3 className="mt-3 text-base font-black leading-6 text-slate-950">{task.title}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadge(task.status)}`}>{task.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{task.nextAction}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <Pill label="Factory" value={task.factory} />
        <Pill label="System" value={task.system} />
        <Pill label="Target" value={task.targetShift} />
        <Pill label="Group" value={task.targetGroup} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2">{task.externalLinks.length ? task.externalLinks.map((link) => <span key={link} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"><ExternalLink className="h-3 w-3" /> {link}</span>) : <span className="text-xs text-slate-400">No external links</span>}</div>
        <button type="button" onClick={() => openTask(task)} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">View details</button>
      </div>
    </article>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 px-3 py-2"><span className="font-bold text-slate-800">{label}:</span> {value}</div>
}

function Section({ title, desc, tasks, icon, openTask }: { title: string; desc: string; tasks: Task[]; icon: React.ReactNode; openTask: (task: Task) => void }) {
  return <section className="rounded-[32px] border border-slate-200 bg-white/80 p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-2xl bg-slate-950 p-2.5 text-white">{icon}</div><div><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="text-sm text-slate-500">{desc}</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{tasks.length}</span></div><div className="space-y-3">{tasks.length ? tasks.map((task) => <TaskCard key={`${title}-${task.id}`} task={task} openTask={openTask} />) : <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No items</div>}</div></section>
}

function Dashboard({ data, openTask }: { data: DashboardData; openTask: (task: Task) => void }) {
  const [query, setQuery] = useState('')
  const matched = useMemo(() => {
    const tasks = data.sections.recentlyUpdated
    if (!query.trim()) return tasks
    const key = query.toLowerCase()
    return tasks.filter((task) => `${task.taskNo} ${task.title} ${task.status} ${task.type} ${task.system} ${task.factory}`.toLowerCase().includes(key))
  }, [data, query])
  return <div className="space-y-6"><Hero data={data} /><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Stat label="Waiting" value={data.sections.waitingNextShift.length} icon={<Clock3 className="h-5 w-5" />} color="bg-indigo-100 text-indigo-700" /><Stat label="Monitoring" value={data.sections.monitoring.length} icon={<MonitorDot className="h-5 w-5" />} color="bg-cyan-100 text-cyan-700" /><Stat label="Need Confirm" value={data.sections.needConfirmation.length} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-orange-100 text-orange-700" /><Stat label="Hypercare" value={data.sections.todayHypercare.length} icon={<CalendarDays className="h-5 w-5" />} color="bg-emerald-100 text-emerald-700" /></section><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><Search className="h-5 w-5 text-blue-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search task..." className="w-full outline-none" /></div></div>{query ? <Section title="Search Results" desc="Matched recent tasks" tasks={matched} icon={<Search className="h-5 w-5" />} openTask={openTask} /> : <div className="grid gap-6 xl:grid-cols-2"><Section title="Waiting for Next Shift" desc="Must be continued by next shift" tasks={data.sections.waitingNextShift} icon={<InboxIcon />} openTask={openTask} /><Section title="Monitoring" desc="Keep visible across shifts" tasks={data.sections.monitoring} icon={<MonitorDot className="h-5 w-5" />} openTask={openTask} /><Section title="Need Confirmation" desc="Needs acknowledgement or acceptance" tasks={data.sections.needConfirmation} icon={<ShieldAlert className="h-5 w-5" />} openTask={openTask} /><Section title="Today Hypercare" desc="Planned checks today" tasks={data.sections.todayHypercare} icon={<AlertTriangle className="h-5 w-5" />} openTask={openTask} /><div className="xl:col-span-2"><Section title="Recently Updated" desc="Latest task activity" tasks={data.sections.recentlyUpdated} icon={<ListChecks className="h-5 w-5" />} openTask={openTask} /></div></div>}</div>
}

function InboxIcon() { return <span className="flex h-5 w-5 items-center justify-center">●</span> }

function DetailDrawer({ task, close, refresh }: { task: Task | null; close: () => void; refresh: () => void }) {
  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!task) return
    setDetail(null)
    setError('')
    api<TaskDetail>(`/api/tasks/${task.id}`).then(setDetail).catch((err) => setError(err.message || 'Failed to load task detail.'))
  }, [task])

  async function run(path: string, body?: object) {
    if (!task) return
    setError('')
    try {
      const updated = await api<TaskDetail>(`/api/tasks/${task.id}/${path}`, { method: 'POST', body: JSON.stringify(body || {}) })
      setDetail(updated)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    }
  }

  if (!task) return null
  return <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm"><div className="ml-auto h-full max-w-4xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4 rounded-[24px] bg-slate-950 p-5 text-white"><div><p className="text-sm font-bold text-blue-200">{task.taskNo}</p><h2 className="mt-2 text-2xl font-black">{task.title}</h2><p className="mt-2 text-sm text-slate-300">Click actions below to test interaction.</p></div><button onClick={close} className="rounded-2xl bg-white/10 px-4 py-2 font-bold hover:bg-white/15">Close</button></div>{error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}{!detail && !error && <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">Loading detail...</div>}{detail && <div className="mt-5 space-y-5"><Panel title="Next Action"><p className="text-sm leading-6 text-slate-600">{detail.nextAction}</p></Panel><Panel title="Description"><p className="text-sm leading-6 text-slate-600">{detail.description}</p></Panel><Panel title="External Links"><div className="space-y-2">{detail.externalLinkDetails.map((link) => <div key={link.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"><div><p className="font-black text-slate-900">{link.type} · {link.externalId || '-'}</p><p className="text-sm text-slate-500">{link.title || link.status || '-'}</p></div>{link.url && <a className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white" href={link.url} target="_blank" rel="noreferrer">Open</a>}</div>)}</div></Panel><Panel title="Handover Records"><div className="space-y-2">{detail.handovers.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-black text-slate-900">{item.fromShift} to {item.toShift} · {item.status}</p><p className="mt-1 text-slate-600">{item.note}</p></div>)}</div></Panel><Panel title="Hypercare Checks"><div className="space-y-2">{detail.hypercareChecks.length ? detail.hypercareChecks.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-black text-slate-900">{item.checkTime}</p><p className="text-slate-600">{item.checkItem} · {item.expectedResult}</p></div>) : <p className="text-sm text-slate-400">No checks.</p>}</div></Panel><Panel title="Process Logs"><div className="space-y-2">{detail.logs.map((log) => <div key={log.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-black text-slate-900">{log.type} · {log.createdAt}</p><p className="text-slate-600">{log.content}</p></div>)}</div></Panel><Panel title="Actions"><div className="grid gap-2 sm:grid-cols-3"><button onClick={() => run('ack')} className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white">Acknowledge</button><button onClick={() => run('accept')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">Accept</button><button onClick={() => run('status', { status: 'Closed' })} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white">Close Task</button></div><div className="mt-3 flex gap-2"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add process note..." className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none" /><button onClick={() => note.trim() && run('logs', { content: note }).then(() => setNote(''))} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white">Add</button></div></Panel></div>}</div></div>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-3 text-base font-black text-slate-950">{title}</h3>{children}</section>
}

function Timeline({ openTask }: { openTask: (task: Task) => void }) {
  const [items, setItems] = useState<Task[]>([])
  useEffect(() => { api<{ items: Task[] }>('/api/timeline').then((res) => setItems(res.items)) }, [])
  return <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-2xl font-black text-slate-950">Timeline</h2><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Task</th><th className="p-3">Status</th><th className="p-3">System</th><th className="p-3">Action</th></tr></thead><tbody>{items.map((task) => <tr key={task.id} className="border-t border-slate-100"><td className="p-3"><p className="font-black text-slate-900">{task.taskNo}</p><p className="text-slate-500">{task.title}</p></td><td className="p-3">{task.status}</td><td className="p-3">{task.system}</td><td className="p-3"><button onClick={() => openTask(task)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">View</button></td></tr>)}</tbody></table></div></section>
}

function Calendar() {
  const [items, setItems] = useState<{ id: number; date: string; shift: string; group: string; startTime: string; endTime: string; members: string; remark: string }[]>([])
  useEffect(() => { api<{ items: typeof items }>('/api/calendar').then((res) => setItems(res.items)) }, [])
  return <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-2xl font-black text-slate-950">Calendar</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{items.map((item) => <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">{item.date}</p><h3 className="mt-2 text-xl font-black text-slate-950">{item.shift}</h3><p className="text-sm text-slate-600">{item.group} · {item.startTime} - {item.endTime}</p><p className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-500">{item.members}</p></div>)}</div></section>
}

function Admin() {
  return <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black text-slate-950">Admin</h2><p className="mt-2 text-sm text-slate-500">Admin modules will be implemented after task creation and timeline filters.</p></section>
}

export default function StableApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [page, setPage] = useState<Page>('handover')
  const [data, setData] = useState<DashboardData>(emptyDashboard)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  async function loadDashboard() {
    const dashboard = await api<DashboardData>('/api/dashboard')
    setData(dashboard)
  }

  useEffect(() => { api<{ user: User | null }>('/api/auth/me').then((res) => setUser(res.user)).catch(() => setUser(null)) }, [])
  useEffect(() => { if (user) loadDashboard().catch(() => setData(emptyDashboard)) }, [user])

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  if (user === undefined) return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading...</main>
  if (!user) return <Login onLogin={setUser} />

  return <main className="min-h-screen bg-slate-100"><Header user={user} page={page} setPage={setPage} onLogout={logout} /><div className="mx-auto max-w-[1500px] space-y-6 px-5 py-6">{page === 'handover' && <Dashboard data={data} openTask={setSelectedTask} />}{page === 'timeline' && <Timeline openTask={setSelectedTask} />}{page === 'calendar' && <Calendar />}{page === 'admin' && <Admin />}</div><DetailDrawer task={selectedTask} close={() => setSelectedTask(null)} refresh={() => loadDashboard()} /></main>
}
