import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title, body, icon: Icon = Inbox }: { title: string; body?: string; icon?: LucideIcon }) {
  return (
    <div className="glass flex flex-col items-center gap-2 p-10 text-center">
      <Icon size={28} className="text-slate-500" />
      <div className="font-semibold">{title}</div>
      {body && <div className="max-w-sm text-xs text-slate-400">{body}</div>}
    </div>
  );
}
