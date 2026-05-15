import { api } from './client'
import type { User } from '../types'
export const authApi = {
  me: () => api<{ user: User | null }>('/api/auth/me'),
  login: (username: string, password: string) => api<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => api('/api/auth/logout', { method: 'POST' }),
}
