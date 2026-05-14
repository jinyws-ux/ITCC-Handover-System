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
  if (priority === 'Critical') return 'border-red-200 bg-red-100 text-red-700'
  if (priority === 'High') return 'border-orange-200 bg-orange-100 text-orange-700'
  if (priority === 'Medium') return 'border-amber-200 bg-amber-100 text-amber-700'
  if (priority === 'Low') return 'border-blue-200 bg-blue-100 text-blue-700'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function statusClass(status: string) {
  if (status === 'Closed') return 'bg-slate-100 text-slate-500'
  if (status === 'Waiting AG') return 'bg-purple-100 text-purple-700'
  if (status === 'Waiting Next Shift') return 'bg-indigo-100 text-indigo-700'
  if (status === 'Monitoring') return 'bg-cyan-100 text-cyan-700'
  return 'bg-emerald-100 text-emerald-700'
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
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
      const result = await api<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      onLogin(result.user)
    } catch {
      setError('Login failed. Try admin/admin123, lead/lead123, or user/user123.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.28),transparent_30%),linear-gradient(135deg,#020617,#0f172a_45%,#111827)]" />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/95 p-8 shadow-2xl">
        <div className="mb-8 rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">ITCC</p>
          <h1 className="mt-3 text-3xl font-bold">Handover System</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Operations handover, external ticket aggregation, and shift tracking.</p>
        </div>
        <label className="block text-sm font-semibold text-slate-700">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-300 focus:ring-4" />
        <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-300 focus:ring-4" />
        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">Login</button>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Demo: <span className="font-semibold text-slate-800">admin/admin123</span>, <span className="font-semibold text-slate-800">lead/lead123</span>, <span className="font-semibold text-slate-800">user/user123</span>
        </div>
      </form>
    </main>
  )
}

function TopNav({ page, setPage, user, onLogout }: { page: Page; setPage: (page: Page) => void; user: User; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 font-black text-white shadow-lg shadow-blue-600/25">IT</div>
            <div>
              <p className="text-lg font-bold text-slate-950">ITCC Handover</p>
              <p className="text-xs text-slate-500">Shift operations control center</p>
            </div>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 lg:hidden"><LogOut className="h-4 w-4" /> Logout</button>
        </div>

        <nav className="flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${page === item.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white lg:flex">
          <UserCircle className="h-5 w-5 text-slate-300" />
          <div>
            <p className="text-sm font-semibold">{user.displayName}</p>
            <p className="text-xs text-slate-400">{user.group} · {user.role}</p>
          </div>
          <button onClick={onLogout} className="ml-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">Logout</button>
        </div>
      </div>
    </header>
  )
}

function Hero({ data, page }: { data: DashboardData; page: Page }) {
  const title = page === 'dashboard' ? 'Shift Handover Dashboard' : navItems.find((item) => item.key === page)?.label
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 text-white shadow-xl shadow-slate-200">
      <div className="relative p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.45),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(34,211,238,0.22),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-200">{data.currentDate}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">One internal TASK view for Helix, Jira, Outlook, AG, Hypercare, phone tasks, and verbal handovers.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ShiftBox label="Current shift" code={data.currentShift.code} time={data.currentShift.time} group={data.currentShift.group} />
            <ShiftBox label="Next shift" code={data.nextShift.code} time={data.nextShift.time} group={data.nextShift.group} highlight />
          </div>
        </div>
      </div>
    </section>
  )
}

function ShiftBox({ label, code, time, group, highlight }: { label: string; code: string; time: string; group: string; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${highlight ? 'border-blue-300/40 bg-blue-500/15' : 'border-white/15 bg-white/10'}`}>
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-bold">{code} · {time}</p>
      <p className="mt-1 text-xs text-slate-300">{group}</p>
    </div>
  )
}

function StatCard({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <div className={`rounded-2xl p-2.5 ${tone}`}>{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  )
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: number) => void }) {
  return (
    <article className={`group rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${task.isED1 ? 'border-orange-300 ring-4 ring-orange-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">{task.taskNo}</span>
            <span className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{task.type}</span>
            <span className={`rounded-xl border px-2.5 py-1 text-xs font-semibold ${priorityClass(task.priority)}`}>{task.priority}</span>
            {task.isED1 && <span className="rounded-xl bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">E to D1</span>}
          </div>
          <h3 className="mt-3 text-base font-bold leading-6 text-slate-950">{task.title}</h3>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}>{task.status}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{task.nextAction}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <InfoPill label="Factory" value={task.factory} />
        <InfoPill label="System" value={task.system} />
        <InfoPill label="Target" value={task.targetShift} />
        <InfoPill label="Group" value={task.targetGroup} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2">
          {task.externalLinks.length ? task.externalLinks.map((link) => (
            <span key={link} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <ExternalLink className="h-3 w-3" /> {link}
            </span>
          )) : <span className="text-xs text-slate-400">No external links</span>}
        </div>
        <button onClick={() => onOpen(task.id)} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700">
          View details
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">Updated {task.updatedAt}</p>
    </article>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">{label}:</span> {value}</div>
}

function Section({ title, description, icon, tasks, onOpen }: { title: string; description: string; icon: React.ReactNode; tasks: Task[]; onOpen: (id: number) => void }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-2.5 text-white">{icon}</div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.length ? tasks.map((task) => <TaskCard key={`${title}-${task.id}`} task={task} onOpen={onOpen} />) : <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No items in this section.</div>}
      </div>
    </section>
  )
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-700"><Search className="h-5 w-5" /></div>
          <div>
            <p className="font-bold text-slate-950">Quick search</p>
            <p className="text-sm text-slate-500">Search task no, title, type, status, factory, system, shift, or group.</p>
          </div>
        </div>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search current tasks..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-blue-100 transition focus:border-blue-300 focus:ring-4 md:max-w-md" />
      </div>
    </div>
  )
}

function DashboardPage({ data, query, setQuery, onOpen }: { data: DashboardData; query: string; setQuery: (value: string) => void; onOpen: (id: number) => void }) {
  const allTasks = useMemo(() => data.sections.recentlyUpdated, [data])
  const matchedTasks = useMemo(() => {
    if (!query.trim()) return allTasks
    const keyword = query.toLowerCase()
    return allTasks.filter((task) => [task.taskNo, task.title, task.type, task.status, task.factory, task.system, task.source, task.targetShift, task.targetGroup].join(' ').toLowerCase().includes(keyword))
  }, [allTasks, query])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting Next Shift" value={data.sections.waitingNextShift.length} icon={<Clock className="h-5 w-5" />} tone="bg-indigo-100 text-indigo-700" />
        <StatCard label="Monitoring" value={data.sections.monitoring.length} icon={<RadioTower className="h-5 w-5" />} tone="bg-cyan-100 text-cyan-700" />
        <StatCard label="Need Confirmation" value={data.sections.needConfirmation.length} icon={<CheckCircle2 className="h-5 w-5" />} tone="bg-orange-100 text-orange-700" />
        <StatCard label="Today Hypercare" value={data.sections.todayHypercare.length} icon={<CalendarDays className="h-5 w-5" />} tone="bg-emerald-100 text-emerald-700" />
      </section>
      <SearchBox value={query} onChange={setQuery} />
      {query.trim() ? <Section title="Search Results" description="Matched tasks from recent updates." icon={<Search className="h-5 w-5" />} tasks={matchedTasks} onOpen={onOpen} /> : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Waiting for Next Shift" description="Tasks that require the next shift to continue." icon={<Inbox className="h-5 w-5" />} tasks={data.sections.waitingNextShift} onOpen={onOpen} />
          <Section title="Monitoring" description="Items that must remain visible across shifts." icon={<RadioTower className="h-5 w-5" />} tasks={data.sections.monitoring} onOpen={onOpen} />
          <Section title="Need Confirmation" description="Items requiring acknowledgement or acceptance." icon={<ShieldAlert className="h-5 w-5" />} tasks={data.sections.needConfirmation} onOpen={onOpen} />
          <Section title="Today Hypercare" description="Planned checks for upgrades, patches, or changes." icon={<AlertTriangle className="h-5 w-5" />} tasks={data.sections.todayHypercare} onOpen={onOpen} />
          <div className="xl:col-span-2"><Section title="Recently Updated" description="Latest handover and task updates." icon={<Layers3 className="h-5 w-5" />} tasks={data.sections.recentlyUpdated} onOpen={onOpen} /></div>
        </div>
      )}
    </div>
  )
}

function TaskDrawer({ taskId, onClose, onChanged }: { taskId: number | null; onClose: () => void; onChanged: () => void }) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!taskId) return
    setTask(null)
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm" onMouseDown={onClose}>
      <aside className="h-full w-full max-w-4xl overflow-y-auto bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        {!task ? <p className="text-slate-500">Loading task detail...</p> : <div className="space-y-6">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-200">{task.taskNo}</p>
                <h2 className="mt-2 text-2xl font-bold">{task.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-semibold text-slate-950">{task.type}</span>
                  <span className={`rounded-xl border px-2.5 py-1 text-xs font-semibold ${priorityClass(task.priority)}`}>{task.priority}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}>{task.status}</span>
                  {task.isED1 && <span className="rounded-xl bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">E to D1</span>}
                </div>
              </div>
              <button onClick={onClose} className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">Close</button>
            </div>
          </div>

          <Panel title="Next action"><p className="text-sm leading-6 text-slate-600">{task.nextAction}</p></Panel>
          <div className="grid gap-3 md:grid-cols-2"><Info label="Factory" value={task.factory} /><Info label="System" value={task.system} /><Info label="Target shift" value={task.targetShift} /><Info label="Target group" value={task.targetGroup} /><Info label="Source" value={task.source} /><Info label="Updated" value={task.updatedAt} /></div>
          <Panel title="Description"><p className="text-sm leading-6 text-slate-600">{task.description}</p></Panel>
          <Panel title="External links"><div className="space-y-2">{task.externalLinkDetails.length ? task.externalLinkDetails.map((link) => <div key={link.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"><div><p className="font-semibold text-slate-800">{link.type} · {link.externalId || '-'}</p><p className="text-sm text-slate-500">{link.title || link.remark || '-'}</p></div>{link.url && <a href={link.url} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Open</a>}</div>) : <p className="text-sm text-slate-400">No external links.</p>}</div></Panel>
          <Panel title="Handover records"><div className="space-y-2">{task.handovers.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><p className="font-semibold text-slate-800">{item.fromShift} to {item.toShift} · {item.status}</p><p className="mt-1">{item.note}</p><p className="mt-1 text-xs text-slate-400">Handed over: {item.handedOverAt} · Ack: {item.acknowledgedAt || '-'} · Accept: {item.acceptedAt || '-'}</p></div>)}</div></Panel>
          <Panel title="Hypercare checks"><div className="space-y-2">{task.hypercareChecks.length ? task.hypercareChecks.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">{item.checkTime} · {item.checkItem}</p><p className="text-slate-500">Expected: {item.expectedResult}</p></div>) : <p className="text-sm text-slate-400">No hypercare checks.</p>}</div></Panel>
          <Panel title="Process logs"><div className="space-y-2">{task.logs.map((log) => <div key={log.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">{log.type} · {log.createdAt}</p><p className="mt-1 text-slate-600">{log.content}</p></div>)}</div></Panel>
          <Panel title="Quick actions"><div className="grid gap-2 sm:grid-cols-3"><button onClick={() => action('ack')} className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Acknowledge</button><button onClick={() => action('accept')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white">Accept</button><button onClick={() => action('status', { status: 'Closed' })} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Close</button></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add process note..." className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none" /><button onClick={() => { if (note.trim()) action('logs', { content: note }).then(() => setNote('')) }} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Add note</button></div></Panel>
        </div>}
      </aside>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value || '-'}</p></div>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-3 font-bold text-slate-950">{title}</h3>{children}</section>
}

function TimelinePage({ onOpen }: { onOpen: (id: number) => void }) {
  const [items, setItems] = useState<Task[]>([])
  useEffect(() => { api<{ items: Task[] }>('/api/timeline').then((res) => setItems(res.items)) }, [])
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Timeline</h2><p className="mt-1 text-sm text-slate-500">Historical task list. Click View to open task detail.</p><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Task</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">System</th><th className="p-3">Action</th></tr></thead><tbody>{items.map((task) => <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="p-3"><p className="font-semibold text-slate-900">{task.taskNo}</p><p className="text-slate-500">{task.title}</p></td><td className="p-3">{task.type}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}>{task.status}</span></td><td className="p-3">{task.system}</td><td className="p-3"><button onClick={() => onOpen(task.id)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white">View</button></td></tr>)}</tbody></table></div></section>
}

function CalendarPage() {
  const [items, setItems] = useState<{ id: number; date: string; shift: string; group: string; startTime: string; endTime: string; members: string; remark: string }[]>([])
  useEffect(() => { api<{ items: typeof items }>('/api/calendar').then((res) => setItems(res.items)) }, [])
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Calendar</h2><p className="mt-1 text-sm text-slate-500">Daily D1 / D2 / E schedule view.</p><div className="mt-5 grid gap-4 md:grid-cols-3">{items.map((item) => <div key={item.id} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">{item.date}</p><h3 className="mt-2 text-lg font-bold text-slate-950">{item.shift} · {item.group}</h3><p className="mt-1 text-sm text-slate-600">{item.startTime} - {item.endTime}</p><p className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm">{item.members}</p>{item.remark && <p className="mt-2 text-xs font-semibold text-orange-600">{item.remark}</p>}</div>)}</div></section>
}

function AdminPage() {
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Admin</h2><p className="mt-2 text-sm leading-6 text-slate-600">Next step: user, group, shift, factory, system, schedule, and Excel import management. The backend data model is already prepared.</p></section>
}

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [page, setPage] = useState<Page>('dashboard')
  const [data, setData] = useState<DashboardData>(fallbackData)
  const [query, setQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  async function loadDashboard() {
    const result = await api<DashboardData>('/api/dashboard')
    setData(result)
  }

  useEffect(() => { api<{ user: User | null }>('/api/auth/me').then((res) => setUser(res.user)).catch(() => setUser(null)) }, [])
  useEffect(() => { if (user) loadDashboard().catch(() => setData(fallbackData)) }, [user])

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  if (user === undefined) return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading...</main>
  if (!user) return <LoginPage onLogin={(nextUser) => setUser(nextUser)} />

  return (
    <main className="min-h-screen bg-slate-100">
      <TopNav page={page} setPage={setPage} user={user} onLogout={logout} />
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 lg:px-8">
        <Hero data={data} page={page} />
        {page === 'dashboard' && <DashboardPage data={data} query={query} setQuery={setQuery} onOpen={setSelectedTaskId} />}
        {page === 'timeline' && <TimelinePage onOpen={setSelectedTaskId} />}
        {page === 'calendar' && <CalendarPage />}
        {page === 'admin' && <AdminPage />}
      </div>
      <TaskDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onChanged={() => loadDashboard()} />
    </main>
  )
}

export default App
