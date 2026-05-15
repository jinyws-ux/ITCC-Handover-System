import { Field } from './Field'
export function Select({ value, set, options, label }: { value: string; set: (v: string) => void; options: string[]; label?: string }) {
  return <Field label={label || ''}><select className="input" value={value} onChange={e => set(e.target.value)}>{options.map(x => <option key={x} value={x}>{x || '-'}</option>)}</select></Field>
}
