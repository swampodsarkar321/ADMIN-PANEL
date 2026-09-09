import type { LucideIcon } from 'lucide-react';

export default function StatsCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: LucideIcon; accent: string }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
        <div className={`rounded-lg p-2 ${accent}`}><Icon size={16} /></div>
      </div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
