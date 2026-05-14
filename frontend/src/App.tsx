import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Home,
  Inbox,
  Layers3,
  ListChecks,
  LogOut,
  RadioTower,
  Search,
  ShieldAlert,
  UserCircle,
} from 'lucide-react'

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
  isMonitoring: boolean
  monitorUntil: string | null
  needAck: boolean
  createdAt: string
  closedAt: string | null
  externalLinkDetails: { id: number; type: string; externalId: string; title: string; url: string; status: string; isPrimary: boolean; remark: string }[]
  logs: { id: number; type: string; content: string; oldStatus: string; newStatus: string; createdAt: string }[]
  handovers: { id: number; fromShift: string; toShift: string; fromGroup: string; toGroup: string; note: string; status: string; handedOverAt: string; acknowledgedAt: string | null; acceptedAt: string | null }[]
  hypercareChecks: { id: number; checkTime: string; checkItem: string; expectedResult: string; actualResult: string; status: string; checkedAt: string | null; remark: string }[]
}

type DashboardData = {
  currentDate: string
  currentShift: { code: string; time: string; group: string }
  nextShift: { code: string; time: string; group: string }
  user: { displayName: string; role: string; group: string }
  sections: {
    waitingNextShift: Task[]
    monitoring: Task[]
    noticeOnly: Task[]
    todayHypercare: Task[]
    needConfirmation: Task[]
    recentlyUpdated: Task[]
  }
}

type Page = 'dashboard' | 'timeline' | 'calendar' | 'admin'

const fallbackData: DashboardData = {
  currentDate: '2026-05-14',
  currentShift: { code: 'D2', time: '09:30 - 18:00', group: 'Group B' },
  nextShift: { code: 'E', time: '17:00 - 03:00', group: 'Group C' },
  user: { displayName: 'Guest', role: 'guest', group: '-' },
  sections: { waitingNextShift: [], monitoring: [], noticeOnly: [], todayHypercare: [], needConfirmation: [], recentlyUpdated: [] },
}

const navItems: { key: Page; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Handover', icon: <Home className="h-4 w-4" /> },
  { key: 'timeline', label: 'Timeline', icon: <ListChecks className="h-4 w-4" /> },
  { key: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-4 w-4" /> },
  { key: 'admin', label: 'Admin', icon: <UserCircle className="h-4 w-4" /> },
]

function priorityClass(priority: string) {
  if (priority === 'Critical') return 'bg-red-100 text-red-700 border-red-200'
  if (priority === 'High') return 'bg-orange-100 text-orange-700 border-orange-200'
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (priority === 'Low') return 'bg-blue-100 text-blue-700 border-blue-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function statusClass(status: string) {
  if (status === 'Closed') return 'bg-slate-100 text-slate-500'
  if (status === 'Waiting AG') return 'bg-purple-100 text-purple-700'
  if (status === 'Waiting Next Shift') return 'bg-indigo-100 text-indigo-700'
  if (status === 'Monitoring') return 'bg-cyan-100 text-cyan-700'
  return 'bg-emerald-100 text-emerald-700'
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const result = await api<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      onLogin(result.user)
    } catch {
      setError('Login failed. Try admin/admin123, lead/lead123, or user/user123.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_32%),linear-gradient(135deg,_#f8fafc,_#eef2ff)] p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">ITCC</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Use the demo account to enter the current handover prototype.</p>
        <label className="mt-6 block text-sm font-semibold text-slate-700">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-slate-300 focus:ring-4" />
        <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-slate-300 focus:ring-4" />
        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-sm hover:bg-slate-800">Login</button>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Demo accounts: <span className="font-semibold text-slate-700">admin/admin123</span>, <span className="font-semibold text-slate-700">lead/lead123</span>, <span className="font-semibold text-slate-700">user/user123</span>
        </div>
      </form>
    </main>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div></div><p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p></div>
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: number) => void }) {
  return (
    <button onClick={() => onOpen(task.id)} className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${task.isED1 ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{task.taskNo}</span>
            <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">{task.type}</span>
            <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${priorityClass(task.priority)}`}>{task.priority}</span>
            {task.isED1 && <span className="rounded-lg bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">E → D1</span>}
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">{task.title}</h3>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}>{task.status}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{task.nextAction}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">Factory:</span> {task.factory}</div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">System:</span> {task.system}</div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">Target:</span> {task.targetShift}</div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">Group:</span> {task.targetGroup}</div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-2">{task.externalLinks.length ? task.externalLinks.map((link) => <span key={link} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"><ExternalLink className="h-3 w-3" /> {link}</span>) : <span className="text-xs text-slate-400">No external links</span>}</div>
        <span className="text-xs text-slate-400">Updated {task.updatedAt}</span>
      </div>
    </button>
  )
}

function Section({ title, description, icon, tasks, onOpen }: { title: string; description: string; icon: React.ReactNode; tasks: Task[]; onOpen: (id: number) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur"><div className="mb-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-2xl bg-slate-950 p-2 text-white">{icon}</div><div><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="text-sm text-slate-500">{description}</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{tasks.length}</span></div><div className="space-y-3">{tasks.length ? tasks.map((task) => <TaskCard key={`${title}-${task.id}`} task={task} onOpen={onOpen} />) : <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No items in this section.</div>}</div></section>
}

function TaskDrawer({ taskId, onClose, onChanged }: { taskId: number | null; onClose: () => void; onChanged: () => void }) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!taskId) return
    api<TaskDetail>(`/api/tasks/${taskId}`).then(setTask).catch(() => setTask(null))
  }, [taskId])

  async function action(path: string, body?: object) {
    if (!taskId) return
    const updated = await api<TaskDetail>(`/api/tasks/${taskId}/${path}`, { method: 'POST', body: JSON.stringify(body || {}) })
    setTask(updated)
    onChanged()
  }

  if (!taskId) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {!task ? <p className="text-slate-500">Loading...</p> : <div className="space-y-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-500">{task.taskNo}</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{task.title}</h2><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-lg bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{task.type}</span><span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${priorityClass(task.priority)}`}>{task.priority}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}>{task.status}</span>{task.isED1 && <span className="rounded-lg bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">E → D1</span>}</div></div><button onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">Close</button></div>
          <div className="rounded-3xl bg-slate-50 p-5"><h3 className="font-semibold text-slate-950">Next action</h3><p className="mt-2 text-sm leading-6 text-slate-600">{task.nextAction}</p></div>
          <div className="grid gap-3 md:grid-cols-2"><Info label="Factory" value={task.factory} /><Info label="System" value={task.system} /><Info label="Target shift" value={task.targetShift} /><Info label="Target group" value={task.targetGroup} /><Info label="Source" value={task.source} /><Info label="Updated" value={task.updatedAt} /></div>
          <Panel title="Description"><p className="text-sm leading-6 text-slate-600">{task.description}</p></Panel>
          <Panel title="External links"><div className="space-y-2">{task.externalLinkDetails.length ? task.externalLinkDetails.map((link) => <div key={link.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"><div><p className="font-semibold text-slate-800">{link.type} · {link.externalId || '-'}</p><p className="text-sm text-slate-500">{link.title || link.remark || '-'}</p></div>{link.url && <a href={link.url} target="_blank" className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Open</a>}</div>) : <p className="text-sm text-slate-400">No external links.</p>}</div></Panel>
          <Panel title="Handover records"><div className="space-y-2">{task.handovers.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><p className="font-semibold text-slate-800">{item.fromShift} → {item.toShift} · {item.status}</p><p className="mt-1">{item.note}</p><p className="mt-1 text-xs text-slate-400">Handed over: {item.handedOverAt} · Ack: {item.acknowledgedAt || '-'} · Accept: {item.acceptedAt || '-'}</p></div>)}</div></Panel>
          <Panel title="Hypercare checks"><div className="space-y-2">{task.hypercareChecks.length ? task.hypercareChecks.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">{item.checkTime} · {item.checkItem}</p><p className="text-slate-500">Expected: {item.expectedResult}</p></div>) : <p className="text-sm text-slate-400">No hypercare checks.</p>}</div></Panel>
          <Panel title="Process logs"><div className="space-y-2">{task.logs.map((log) => <div key={log.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">{log.type} · {log.createdAt}</p><p className="mt-1 text-slate-600">{log.content}</p></div>)}</div></Panel>
          <Panel title="Quick actions"><div className="grid gap-2 sm:grid-cols-3"><button onClick={() => action('ack')} className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Acknowledge</button><button onClick={() => action('accept')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white">Accept</button><button onClick={() => action('status', { status: 'Closed' })} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Close</button></div><div className="mt-4 flex gap-2"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add process note..." className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none" /><button onClick={() => { if (note.trim()) action('logs', { content: note }).then(() => setNote('')) }} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Add</button></div></Panel>
        </div>}
      </aside>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | null }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value || '-'}</p></div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl border border-slate-200 p-5"><h3 className="mb-3 font-semibold text-slate-950">{title}</h3>{children}</section> }

function DashboardPage({ data, query, setQuery, onOpen }: { data: DashboardData; query: string; setQuery: (value: string) => void; onOpen: (id: number) => void }) {
  const allTasks = useMemo(() => data.sections.recentlyUpdated, [data])
  const matchedTasks = useMemo(() => {
    if (!query.trim()) return allTasks
    const keyword = query.toLowerCase()
    return allTasks.filter((task) => [task.taskNo, task.title, task.type, task.status, task.factory, task.system, task.source, task.targetShift, task.targetGroup].join(' ').toLowerCase().includes(keyword))
  }, [allTasks, query])

  return <div className="space-y-6"><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard label="Waiting Next Shift" value={data.sections.waitingNextShift.length} icon={<Clock className="h-5 w-5" />} /><StatCard label="Monitoring" value={data.sections.monitoring.length} icon={<RadioTower className="h-5 w-5" />} /><StatCard label="Need Confirmation" value={data.sections.needConfirmation.length} icon={<CheckCircle2 className="h-5 w-5" />} /><StatCard label="Today Hypercare" value={data.sections.todayHypercare.length} icon={<CalendarDays className="h-5 w-5" />} /></section><SearchBox value={query} onChange={setQuery} />{query.trim() ? <Section title="Search Results" description="Matched tasks from recent updates." icon={<Search className="h-5 w-5" />} tasks={matchedTasks} onOpen={onOpen} /> : <div className="grid gap-6 xl:grid-cols-2"><Section title="Waiting for Next Shift" description="Tasks that require the next shift to continue." icon={<Inbox className="h-5 w-5" />} tasks={data.sections.waitingNextShift} onOpen={onOpen} /><Section title="Monitoring" description="Items that must remain visible across shifts." icon={<RadioTower className="h-5 w-5" />} tasks={data.sections.monitoring} onOpen={onOpen} /><Section title="Need Confirmation" description="Items requiring acknowledgement or acceptance." icon={<ShieldAlert className="h-5 w-5" />} tasks={data.sections.needConfirmation} onOpen={onOpen} /><Section title="Today Hypercare" description="Planned checks for upgrades, patches, or changes." icon={<AlertTriangle className="h-5 w-5" />} tasks={data.sections.todayHypercare} onOpen={onOpen} /><div className="xl:col-span-2"><Section title="Recently Updated" description="Latest handover and task updates." icon={<Layers3 className="h-5 w-5" />} tasks={data.sections.recentlyUpdated} onOpen={onOpen} /></div></div>}</div>
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className="rounded-2xl bg-slate-100 p-2 text-slate-600"><Search className="h-5 w-5" /></div><div><p className="font-semibold text-slate-950">Quick search</p><p className="text-sm text-slate-500">Search task no, title, type, status, factory, system, shift, or group.</p></div></div><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search current tasks..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:ring-4 md:max-w-md" /></div></div>
}

function TimelinePage({ onOpen }: { onOpen: (id: number) => void }) {
  const [items, setItems] = useState<Task[]>([])
  useEffect(() => { api<{ items: Task[] }>('/api/timeline').then((res) => setItems(res.items)) }, [])
  return <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Timeline</h2><p className="mt-1 text-sm text-slate-500">Historical task list. Filters will be expanded later.</p><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Task</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">System</th><th className="p-3">Updated</th></tr></thead><tbody>{items.map((task) => <tr key={task.id} onClick={() => onOpen(task.id)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"><td className="p-3"><p className="font-semibold text-slate-900">{task.taskNo}</p><p className="text-slate-500">{task.title}</p></td><td className="p-3">{task.type}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}>{task.status}</span></td><td className="p-3">{task.system}</td><td className="p-3 text-slate-500">{task.updatedAt}</td></tr>)}</tbody></table></div></section>
}

function CalendarPage() {
  const [items, setItems] = useState<{ id: number; date: string; shift: string; group: string; startTime: string; endTime: string; members: string; remark: string }[]>([])
  useEffect(() => { api<{ items: typeof items }>('/api/calendar').then((res) => setItems(res.items)) }, [])
  return <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Calendar</h2><p className="mt-1 text-sm text-slate-500">Daily D1 / D2 / E schedule view.</p><div className="mt-5 grid gap-4 md:grid-cols-3">{items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-500">{item.date}</p><h3 className="mt-2 text-lg font-bold text-slate-950">{item.shift} · {item.group}</h3><p className="mt-1 text-sm text-slate-600">{item.startTime} - {item.endTime}</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">{item.members}</p>{item.remark && <p className="mt-2 text-xs text-orange-600">{item.remark}</p>}</div>)}</div></section>
}

function AdminPage() { return <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Admin</h2><p className="mt-2 text-sm leading-6 text-slate-600">Next step: user, group, shift, factory, system, schedule, and Excel import management. The backend data model is already prepared.</p></section> }

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [page, setPage] = useState<Page>('dashboard')
  const [data, setData] = useState<DashboardData>(fallbackData)
  const [query, setQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  async function loadDashboard() { const result = await api<DashboardData>('/api/dashboard'); setData(result) }
  useEffect(() => { api<{ user: User | null }>('/api/auth/me').then((res) => setUser(res.user)).catch(() => setUser(null)) }, [])
  useEffect(() => { if (user) loadDashboard().catch(() => setData(fallbackData)) }, [user])

  async function logout() { await api('/api/auth/logout', { method: 'POST' }); setUser(null) }

  if (user === undefined) return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading...</main>
  if (!user) return <LoginPage onLogin={(nextUser) => setUser(nextUser)} />

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe,_transparent_36%),linear-gradient(135deg,_#f8fafc,_#eef2ff)]"><div className="mx-auto flex max-w-[1500px] gap-6 p-6"><aside className="sticky top-6 hidden h-[calc(100vh-48px)] w-64 shrink-0 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur lg:block"><div className="px-3 py-2"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">ITCC</p><h1 className="mt-2 text-xl font-bold text-slate-950">Handover</h1></div><nav className="mt-6 space-y-2">{navItems.map((item) => <button key={item.key} onClick={() => setPage(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${page === item.key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{item.icon}{item.label}</button>)}</nav><div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">{user.displayName}</p><p className="text-sm text-slate-500">{user.group} · {user.role}</p><button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><LogOut className="h-4 w-4" /> Logout</button></div></aside><div className="min-w-0 flex-1 space-y-6"><header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">ITCC Handover System</p><h1 className="mt-2 text-3xl font-bold text-slate-950">{page === 'dashboard' ? 'Shift Handover Dashboard' : navItems.find((item) => item.key === page)?.label}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">One internal TASK view for Helix, Jira, Outlook, AG, Hypercare, phone tasks, and verbal handovers.</p></div><div className="grid gap-2 rounded-2xl bg-slate-950 p-4 text-white shadow-sm sm:grid-cols-2"><div><p className="text-xs text-slate-400">Current shift</p><p className="font-semibold">{data.currentShift.code} · {data.currentShift.time}</p><p className="text-xs text-slate-300">{data.currentShift.group}</p></div><div><p className="text-xs text-slate-400">Next shift</p><p className="font-semibold">{data.nextShift.code} · {data.nextShift.time}</p><p className="text-xs text-slate-300">{data.nextShift.group}</p></div></div></div></header>{page === 'dashboard' && <DashboardPage data={data} query={query} setQuery={setQuery} onOpen={setSelectedTaskId} />}{page === 'timeline' && <TimelinePage onOpen={setSelectedTaskId} />}{page === 'calendar' && <CalendarPage />}{page === 'admin' && <AdminPage />}</div></div><TaskDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onChanged={() => loadDashboard()} /></main>
}

export default App
