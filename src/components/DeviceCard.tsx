import { Link } from 'react-router-dom';
import { isOnline, type Device } from '../firebase/database';
import { timeAgo } from '../utils/format';

export function StatusDot({ device }: { device: Device }) {
  const on = isOnline(device);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      {on ? 'Online' : 'Offline'}
    </span>
  );
}

export default function DeviceCard({ device }: { device: Device }) {
  return (
    <Link to={`/devices/${encodeURIComponent(device.id)}`} className="glass block p-4 transition hover:border-sky-500/40">
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold">● {device.name}</div>
        <StatusDot device={device} />
      </div>
      <div className="mt-1 text-xs text-slate-400">{device.browser} · {device.os} · v{device.extensionVersion}</div>
      <div className="mt-1 font-mono text-[11px] text-sky-300">{device.id}</div>
      <div className="mt-2 truncate text-xs text-slate-300">
        {device.currentTab ? `${device.currentTab.title} — ${device.currentTab.domain}` : 'No active tab'}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {device.openTabsCount ?? (device.openTabs ? Object.keys(device.openTabs).length : 0)} tabs open · Last seen {timeAgo(device.lastSeen)}
      </div>
    </Link>
  );
}
