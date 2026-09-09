import type { ActivityEntry } from '../firebase/database';
import { fmtDuration, fmtTime } from '../utils/format';

export default function ActivityTimeline({ rows }: { rows: ActivityEntry[] }) {
  if (!rows.length) return <div className="text-sm text-slate-500">No recent activity.</div>;
  return (
    <ol className="relative ml-2 space-y-4 border-l border-white/10 pl-5">
      {rows.slice(0, 50).map((r) => (
        <li key={r.id} className="relative">
          <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
          <div className="text-xs text-slate-400">{fmtTime(r.timestamp)} · {fmtDuration(r.seconds)}</div>
          <div className="truncate text-sm font-semibold">{r.title}</div>
          <div className="truncate font-mono text-[11px] text-slate-500" title={r.url}>{r.domain} — {r.url}</div>
        </li>
      ))}
    </ol>
  );
}
