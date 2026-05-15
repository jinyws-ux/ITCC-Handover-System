import { api } from './client'

export function updateHypercareCheckStatus(checkId: number, payload: { status: string }) {
  return api(`/api/hypercare-checks/${checkId}/status`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
