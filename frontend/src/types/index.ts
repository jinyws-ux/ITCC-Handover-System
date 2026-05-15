export type Lang = 'zh' | 'en'
export type Page = 'handover' | 'new' | 'timeline' | 'calendar' | 'admin'

export type User = { id: number; username: string; displayName: string; email: string; role: string; group: string }
export type Option = { id: number; name?: string; code?: string; displayName?: string; defaultStartTime?: string; defaultEndTime?: string; username?: string; role?: string; group?: string; factory?: string }
export type Meta = { groups: Option[]; shifts: Option[]; factories: Option[]; systems: Option[]; users: Option[] }
export type Task = { id: number; taskNo: string; title: string; type: string; priority: string; status: string; handoverCategory: string; factory: string; system: string; source: string; targetShift: string; targetGroup: string; nextAction: string; externalLinks: string[]; isED1: boolean; updatedAt: string }
export type HypercareCheck = { id: number; taskId?: number; taskNo?: string; title?: string; checkTime?: string; date?: string; time?: string; checkItem: string; expectedResult: string; actualResult?: string; status: string; checkedAt?: string; remark?: string; system?: string; factory?: string }
export type Detail = Task & { description: string; isMonitoring?: boolean; externalLinkDetails: { id: number; type: string; externalId: string; title: string; url: string; status: string; remark: string }[]; logs: { id: number; type: string; content: string; createdAt: string }[]; hypercareChecks: HypercareCheck[] }
export type Dashboard = { currentDate: string; currentShift: { code: string; time: string; group: string }; nextShift: { code: string; time: string; group: string }; sections: { waitingNextShift: Task[]; monitoring: Task[]; todayHypercare: Task[]; completed: Task[] } }
export type Schedule = { id: number; date: string; shift: string; shiftId: number; group: string; groupId: number; startTime: string; endTime: string; members: string; remark: string }
export type CalendarRich = { items: Schedule[]; hypercare: HypercareCheck[]; byDate: Record<string, { schedules: Schedule[]; hypercare: HypercareCheck[] }> }
export type TimelineEvent = { eventType: string; eventTime: string; task: Task; content: string; logType: string; externalLinks: { type: string; id: string; title: string; status: string; url: string }[] }
export type TimelineRich = { items: Task[]; events: TimelineEvent[]; total: number }
export type AdminSummary = { counts: Record<string, number>; meta: Meta }

export const emptyMeta: Meta = { groups: [], shifts: [], factories: [], systems: [], users: [] }
export const emptyDash: Dashboard = { currentDate: '-', currentShift: { code: '-', time: '-', group: '-' }, nextShift: { code: '-', time: '-', group: '-' }, sections: { waitingNextShift: [], monitoring: [], todayHypercare: [], completed: [] } }
export const emptyCal: CalendarRich = { items: [], hypercare: [], byDate: {} }
