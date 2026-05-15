import type { ReactNode } from 'react'
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-3 font-black text-slate-950">{title}</h3>{children}</section>
}
