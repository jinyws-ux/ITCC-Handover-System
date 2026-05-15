export async function api<TData>(url: string, options?: RequestInit): Promise<TData> {
  const r = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}
