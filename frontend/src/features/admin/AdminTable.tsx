import { tByLang } from '../../i18n/dictionary'
import type { Lang, Meta, Option } from '../../types'

export function AdminTable({ tab, lang, meta }: { tab: 'users' | 'groups' | 'factories' | 'systems' | 'shifts'; lang: Lang; meta: Meta }) {
  const t = tByLang(lang)
  const data = (meta as Record<string, Option[]>)[tab] || []
  return <div className="overflow-hidden rounded-2xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">ID</th><th>{t.name}</th><th>{t.code}</th><th>{t.group}/{t.factory}</th><th>{t.role}</th></tr></thead><tbody>{data.map(x => <tr key={x.id} className="border-t"><td className="p-3">{x.id}</td><td className="font-bold">{x.name || x.displayName || x.username}</td><td>{x.code || '-'}</td><td>{x.group || x.factory || '-'}</td><td>{x.role || '-'}</td></tr>)}</tbody></table></div>
}
