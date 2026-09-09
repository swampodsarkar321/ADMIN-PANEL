import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar, { type ToastMsg } from './components/Topbar';
import { ToastHost, type Toast } from './components/Toast';
import { AuthProvider, useAuth } from './firebase/auth';
import { firebaseConfigError } from './firebase/config';
import { subscribeDevices, subscribeCommands, subscribeBlockEvents, isOnline } from './firebase/database';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetails from './pages/DeviceDetails';
import LiveActivity from './pages/LiveActivity';
import BlockedSites from './pages/BlockedSites';
import Quotas from './pages/Quotas';
import Commands from './pages/Commands';
import Notifications from './pages/Notifications';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/devices': 'Devices',
  '/live': 'Live Activity',
  '/blocked': 'Blocked Sites',
  '/quotas': 'Time Quotas',
  '/commands': 'Commands',
  '/notify': 'Notifications',
  '/alerts': 'Blocked Attempts',
  '/settings': 'Settings',
  '/admin': 'Admin',
};

function Shell() {
  const { user, loading, isAdmin } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevDevices = useRef<Map<string, boolean>>(new Map());
  const deviceNames = useRef<Map<string, string>>(new Map());
  const firstRun = useRef(true);

  const notify = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-9), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // Presence toasts: device connected / disconnected
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDevices((devices) => {
      const now = new Map(devices.map((d) => [d.id, isOnline(d)]));
      if (!firstRun.current) {
        for (const [id, on] of now) {
          const was = prevDevices.current.get(id);
          const dev = devices.find((d) => d.id === id);
          if (was === undefined && on) notify(`Device connected: ${dev?.name || id}`);
          else if (was !== undefined && was !== on) {
            notify(on ? `Device connected: ${dev?.name || id}` : `Device disconnected: ${dev?.name || id}`);
          }
        }
      }
      firstRun.current = false;
      prevDevices.current = now;
      deviceNames.current = new Map(devices.map((d) => [d.id, d.name]));
    });
    return () => unsub();
  }, [user, notify]);

  // Command executed toasts
  useEffect(() => {
    if (!user) return;
    const seen = new Set<string>();
    let first = true;
    const unsub = subscribeCommands(null, (cmds) => {
      if (first) {
        cmds.forEach((c) => seen.add(`${c.deviceId}/${c.id}/${c.status}`));
        first = false;
        return;
      }
      for (const c of cmds) {
        const k = `${c.deviceId}/${c.id}/${c.status}`;
        if (!seen.has(k) && (c.status === 'executed' || c.status === 'failed')) {
          seen.add(k);
          notify(c.status === 'executed' ? 'Command executed' : `Command failed${c.error ? `: ${c.error}` : ''}`);
        }
      }
    });
    return () => unsub();
  }, [user, notify]);

  // Blocked-attempt toasts
  useEffect(() => {
    if (!user) return;
    const seen = new Set<string>();
    let first = true;
    const unsub = subscribeBlockEvents(null, (evs) => {
      if (first) {
        evs.forEach((e) => seen.add(`${e.deviceId}/${e.id}`));
        first = false;
        return;
      }
      for (const e of evs) {
        const k = `${e.deviceId}/${e.id}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const name = deviceNames.current.get(e.deviceId) || e.deviceId;
        notify(e.kind === 'quota' ? `⏱️ Quota hit: ${name} tried ${e.domain}` : `⛔ Blocked attempt: ${name} tried ${e.domain}`);
      }
    });
    return () => unsub();
  }, [user, notify]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }
  if (!user || !isAdmin) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopbarTitle onMenu={() => setMobileNav((s) => !s)} toasts={toasts} />
        {mobileNav && <MobileNav onNavigate={() => setMobileNav(false)} />}
        <main className="mx-auto w-full max-w-6xl flex-1 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/:id" element={<DeviceDetails notify={notify} />} />
            <Route path="/live" element={<LiveActivity />} />
            <Route path="/blocked" element={<BlockedSites notify={notify} />} />
            <Route path="/quotas" element={<Quotas notify={notify} />} />
            <Route path="/commands" element={<Commands notify={notify} />} />
            <Route path="/notify" element={<Notifications notify={notify} />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings notify={notify} />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <ToastHost toasts={toasts} />
    </div>
  );
}

function TopbarTitle({ onMenu, toasts }: { onMenu: () => void; toasts: ToastMsg[] }) {
  const loc = useLocation();
  const title = loc.pathname.startsWith('/devices/') ? 'Device Details' : TITLES[loc.pathname] || 'Browser Guard';
  return <Topbar title={title} onMenu={onMenu} toasts={toasts} />;
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const items = [
    ['/', 'Dashboard'],
    ['/devices', 'Devices'],
    ['/live', 'Live Activity'],
    ['/blocked', 'Blocked Sites'],
    ['/quotas', 'Quotas'],
    ['/commands', 'Commands'],
    ['/notify', 'Notifications'],
    ['/alerts', 'Alerts'],
    ['/settings', 'Settings'],
    ['/admin', 'Admin'],
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-white/5 p-2 md:hidden">
      {items.map(([to, label]) => (
        <button key={to} onClick={() => { navigate(to); onNavigate(); }} className="whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
          {label}
        </button>
      ))}
    </nav>
  );
}

function FirebaseSetupError() {
  const vars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_DATABASE_URL',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_ADMIN_EMAILS (optional)',
  ];
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-lg space-y-3 p-6">
        <h1 className="text-lg font-extrabold">⚠️ Firebase config missing</h1>
        <p className="text-sm text-slate-400">
          {firebaseConfigError || 'Firebase is not configured.'} The app was built without its environment variables.
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
          <li>Vercel → Project → <b>Settings → Environment Variables</b></li>
          <li>Add these for <b>Production</b> (and Preview):</li>
        </ol>
        <code className="block rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-sky-300">
          {vars.join('\n')}
        </code>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300" start={3}>
          <li>Deployments → <b>Redeploy</b> with <b>Build Cache OFF</b></li>
        </ol>
      </div>
    </div>
  );
}

export default function App() {
  if (firebaseConfigError) return <FirebaseSetupError />;
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
