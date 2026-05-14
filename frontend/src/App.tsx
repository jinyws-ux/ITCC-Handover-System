import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, ExternalLink, Inbox, Layers3, RadioTower, Search, ShieldAlert } from 'lucide-react'

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

const fallbackData: DashboardData = {
  currentDate: '2026-05-14',
  currentShift: { code: 'D2', time: '09:30 - 18:00', group: 'Group B' },
  nextShift: { code: 'E', time: '17:00 - 03:00', group: 'Group C' },
  user: { displayName: 'Demo User', role: 'admin', group: 'Group B' },
  sections: {
    waitingNextShift: [],
    monitoring: [],
    noticeOnly: [],
    todayHypercare: [],
    needConfirmation: [],
    recentlyUpdated: []
  }
}

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

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${task.isED1 ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
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

      <p className="mt-3 text-sm leading-6 text-slate-600">{task.nextAction}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">Factory:</span> {task.factory}</div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">System:</span> {task.system}</div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">Target:</span> {task.targetShift}</div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-700">Group:</span> {task.targetGroup}</div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-2">
          {task.externalLinks.length ? task.externalLinks.map((link) => (
            <span key={link} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <ExternalLink className="h-3 w-3" /> {link}
            </span>
          )) : <span className="text-xs text-slate-400">No external links</span>}
        </div>
        <span className="text-xs text-slate-400">Updated {task.updatedAt}</span>
      </div>
    </article>
  )
}

function Section({ title, description, icon, tasks }: { title: string; description: string; icon: React.ReactNode; tasks: Task[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-2 text-white">{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.length ? tasks.map((task) => <TaskCard key={`${title}-${task.id}`} task={task} />) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No items in this section.</div>
        )}
      </div>
    </section>
  )
}

function App() {
  const [data, setData] = useState<DashboardData>(fallbackData)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(fallbackData))
  }, [])

  const allTasks = useMemo(() => data.sections.recentlyUpdated, [data])
  const matchedTasks = useMemo(() => {
    if (!query.trim()) return allTasks
    const keyword = query.toLowerCase()
    return allTasks.filter((task) => [task.taskNo, task.title, task.type, task.status, task.factory, task.system, task.source, task.targetShift, task.targetGroup].join(' ').toLowerCase().includes(keyword))
  }, [allTasks, query])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe,_transparent_36%),linear-gradient(135deg,_#f8fafc,_#eef2ff)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">ITCC Handover System</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Shift Handover Dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">One internal TASK view for Helix, Jira, Outlook, AG, Hypercare, phone tasks, and verbal handovers.</p>
            </div>
            <div className="grid gap-2 rounded-2xl bg-slate-950 p-4 text-white shadow-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400">Current shift</p>
                <p className="font-semibold">{data.currentShift.code} · {data.currentShift.time}</p>
                <p className="text-xs text-slate-300">{data.currentShift.group}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Next shift</p>
                <p className="font-semibold">{data.nextShift.code} · {data.nextShift.time}</p>
                <p className="text-xs text-slate-300">{data.nextShift.group}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Waiting Next Shift" value={data.sections.waitingNextShift.length} icon={<Clock className="h-5 w-5" />} />
          <StatCard label="Monitoring" value={data.sections.monitoring.length} icon={<RadioTower className="h-5 w-5" />} />
          <StatCard label="Need Confirmation" value={data.sections.needConfirmation.length} icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard label="Today Hypercare" value={data.sections.todayHypercare.length} icon={<CalendarDays className="h-5 w-5" />} />
        </section>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600"><Search className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold text-slate-950">Quick search</p>
                <p className="text-sm text-slate-500">Search task no, title, type, status, factory, system, shift, or group.</p>
              </div>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search current tasks..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:ring-4 md:max-w-md"
            />
          </div>
        </div>

        {query.trim() ? (
          <Section title="Search Results" description="Matched tasks from recent updates." icon={<Search className="h-5 w-5" />} tasks={matchedTasks} />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Waiting for Next Shift" description="Tasks that require the next shift to continue." icon={<Inbox className="h-5 w-5" />} tasks={data.sections.waitingNextShift} />
            <Section title="Monitoring" description="Items that must remain visible across shifts." icon={<RadioTower className="h-5 w-5" />} tasks={data.sections.monitoring} />
            <Section title="Need Confirmation" description="Items requiring acknowledgement or acceptance." icon={<ShieldAlert className="h-5 w-5" />} tasks={data.sections.needConfirmation} />
            <Section title="Today Hypercare" description="Planned checks for upgrades, patches, or changes." icon={<AlertTriangle className="h-5 w-5" />} tasks={data.sections.todayHypercare} />
            <div className="xl:col-span-2">
              <Section title="Recently Updated" description="Latest handover and task updates." icon={<Layers3 className="h-5 w-5" />} tasks={data.sections.recentlyUpdated} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
