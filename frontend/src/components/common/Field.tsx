import type { ReactNode } from 'react'
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">{label}</span>{children}</label>
}
