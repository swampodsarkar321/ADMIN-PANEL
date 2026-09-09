import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MonitorSmartphone, Activity, Ban, Hourglass, Terminal, Bell, ShieldAlert, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../firebase/auth';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/devices', label: 'Devices', icon: MonitorSmartphone },
  { to: '/live', label: 'Live Activity', icon: Activity },
  { to: '/blocked', label: 'Blocked Sites', icon: Ban },
  { to: '/quotas', label: 'Quotas', icon: Hourglass },
  { to: '/commands', label: 'Commands', icon: Terminal },
  { to: '/notify', label: 'Notifications', icon: Bell },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1 p-4">
      <div className="glass p-4 mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xl">🛡️</div>
        <div>
          <div className="font-extrabold tracking-wide text-sm">BROWSER GUARD</div>
          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{user?.email}</div>
        </div>
      </div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`
          }
        >
          <l.icon size={17} /> {l.label}
        </NavLink>
      ))}
      <div className="mt-auto glass p-3 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-400" />
        Managed browsers only. Consent-based monitoring.
      </div>
      <button onClick={() => logout()} className="btn-ghost justify-center text-xs">
        <LogOut size={14} /> Sign out
      </button>
    </aside>
  );
}
