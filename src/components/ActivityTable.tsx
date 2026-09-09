import type { ActivityEntry } from '../firebase/database';
import { fmtDuration, fmtTime } from '../utils/format';
import { shortUrl } from '../utils/sanitize';

export default function ActivityTable({ rows, deviceNames }: { rows: ActivityEntry[]; deviceNames?: Map<string, string> }) {
  return (
    <div className="glass overflow-x-auto scroll-thin">
      <table className="table w-full min-w-[820px]">
        <thead><tr><th>Device</th><th>Title</th><th>Domain</th><th>URL</th><th>Active</th><th>Time</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.deviceId}-${r.id}`} className="hover:bg-white/[0.02]">
              <td className="font-medium text-slate-200">{deviceNames?.get(r.deviceId) || r.deviceId}</td>
              <td className="max-w-[220px] truncate" title={r.title}>{r.title}</td>
              <td className="text-sky-300">{r.domain}</td>
              <td className="max-w-[260px] truncate font-mono text-[12px] text-slate-400" title={r.url}>{shortUrl(r.url, 52)}</td>
              <td className="text-slate-300">{fmtDuration(r.seconds)}</td>
              <td className="whitespace-nowrap text-slate-400">{fmtTime(r.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
