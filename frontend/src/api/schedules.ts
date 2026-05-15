import { api } from './client'
import type { CalendarRich, Schedule } from '../types'

export function getCalendarRich(month: string) {
  return api<CalendarRich>(`/api/calendar-rich?month=${month}`)
}

export function createSchedule(payload: Record<string, unknown>) {
  return api<Schedule>('/api/admin/schedules', { method: 'POST', body: JSON.stringify(payload) })
}

export function patchSchedule(scheduleId: number, payload: Record<string, unknown>) {
  return api<Schedule>(`/api/admin/schedules/${scheduleId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deleteSchedule(scheduleId: number) {
  return api(`/api/admin/schedules/${scheduleId}`, { method: 'DELETE' })
}

export function confirmScheduleImport(payload: { month: string; overwrite: boolean; items: unknown[] }) {
  return api('/api/admin/schedules/import-confirm', { method: 'POST', body: JSON.stringify(payload) })
}
