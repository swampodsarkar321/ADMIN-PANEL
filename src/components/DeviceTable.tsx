import { Link } from 'react-router-dom';
import { isOnline, type Device } from '../firebase/database';
import { timeAgo, fmtTime } from '../utils/format';
import { StatusDot } from './DeviceCard';
import LiveUptime from './LiveUptime';

export default function DeviceTable({ devices }: { devices: Device[] }) {
  return (
    <div className="glass overflow-x-auto scroll-thin">
      <table className="table w-full min-w-[720px]">
        <thead><tr><th>Device</th><th>Browser / OS</th><th>Status</th><th>Open Tabs</th><th>Browser Time</th><th>Current tab</th><th>Last seen</th></tr></thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id} className="hover:bg-white/[0.02]">
              <td>
                <Link to={`/devices/${encodeURIComponent(d.id)}`} className="font-semibold text-sky-300 hover:underline">{d.name}</Link>
                <div className="font-mono text-[11px] text-slate-500">{d.id}</div>
              </td>
              <td className="text-slate-300">{d.browser} · {d.os}<div className="text-[11px] text-slate-500">v{d.extensionVersion}</div></td>
              <td><StatusDot device={d} /><div className="text-[11px] text-slate-500">{d.online && !isOnline(d) ? 'stale heartbeat' : ''}</div></td>
              <td className="text-center"><span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-sky-300">{d.openTabsCount ?? (d.openTabs ? Object.keys(d.openTabs).length : 0)}</span></td>
              <td className="whitespace-nowrap">
                <LiveUptime session={d.browserSession} live={isOnline(d)} />
                {d.browserSession?.startedAt ? <div className="text-[11px] text-slate-500">since {fmtTime(d.browserSession.startedAt)}</div> : null}
              </td>
              <td className="max-w-[260px] truncate text-slate-300" title={d.currentTab?.url || ''}>{d.currentTab ? `${d.currentTab.title}` : '—'}<div className="text-[11px] text-slate-500">{d.currentTab?.domain || ''}</div></td>
              <td className="text-slate-400">{timeAgo(d.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
