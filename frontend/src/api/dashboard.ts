import { api } from './client'
import type { Dashboard } from '../types'

export function getDashboardV2(businessDate: string) {
  return api<Dashboard>(`/api/dashboard-v2?businessDate=${businessDate}`)
}
