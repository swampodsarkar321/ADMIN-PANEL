import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input className="input !pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Search device, domain, title, URL…'} />
    </div>
  );
}
