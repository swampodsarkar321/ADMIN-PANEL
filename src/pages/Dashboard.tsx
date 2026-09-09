import { useMemo } from 'react';
import { MonitorSmartphone, Wifi, WifiOff, AppWindow, Ban, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../components/StatsCard';
import LoadingState from '../components/LoadingState';
import { useDevices } from '../hooks/useDevices';
import { useActivity } from '../hooks/useActivity';
import { useBlockedRules } from '../hooks/useBlockedRules';
import { isOnline } from '../firebase/database';
import { fmtDuration } from '../utils/format';

const COLORS = ['#0ea5e9', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];

export default function Dashboard() {
  const { devices, loading: dLoading } = useDevices();
  const { activity, loading: aLoading } = useActivity(null, 1000);
  const { rules } = useBlockedRules();

  const online = devices.filter(isOnline);
  const activeTabs = devices.filter((d) => d.currentTab && isOnline(d)).length;

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const todayActivity = activity.filter((a) => a.timestamp >= todayStart);
  const todaySeconds = todayActivity.reduce((s, a) => s + (a.seconds || 0), 0);

  const byHour = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, minutes: 0 }));
    for (const a of activity) {
      const h = new Date(a.timestamp).getHours();
      buckets[h].minutes += Math.round((a.seconds || 0) / 60);
    }
    return buckets;
  }, [activity]);

  const topDomains = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of activity) m.set(a.domain, (m.get(a.domain) || 0) + (a.seconds || 0));
    return [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 7).map(([domain, seconds]) => ({ domain, seconds }));
  }, [activity]);

  if (dLoading || aLoading) return <LoadingState label="Loading dashboard…" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6 lg:grid-cols-3">
        <StatsCard label="Total Devices" value={devices.length} icon={MonitorSmartphone} accent="bg-sky-500/15 text-sky-300" />
        <StatsCard label="Online" value={online.length} icon={Wifi} accent="bg-emerald-500/15 text-emerald-300" />
        <StatsCard label="Offline" value={devices.length - online.length} icon={WifiOff} accent="bg-slate-500/15 text-slate-300" />
        <StatsCard label="Active Tabs" value={activeTabs} icon={AppWindow} accent="bg-indigo-500/15 text-indigo-300" />
        <StatsCard label="Blocked Sites" value={rules.filter((r) => r.enabled).length} sub={`${rules.length} rules`} icon={Ban} accent="bg-rose-500/15 text-rose-300" />
        <StatsCard label="Today's Activity" value={fmtDuration(todaySeconds)} sub={`${todayActivity.length} sessions`} icon={Activity} accent="bg-amber-500/15 text-amber-300" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="glass p-4 lg:col-span-3">
          <div className="font-bold">Activity by Hour</div>
          <div className="text-xs text-slate-400">Minutes of tracked browsing per hour (recent {activity.length} sessions)</div>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byHour}>
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Bar dataKey="minutes" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass p-4 lg:col-span-2">
          <div className="font-bold">Top Domains</div>
          <div className="mt-2 space-y-2">
            {topDomains.map((d, i) => (
              <div key={d.domain} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 truncate text-slate-300">{d.domain || '(unknown)'}</span>
                <span className="font-mono text-xs text-slate-400">{fmtDuration(d.seconds)}</span>
              </div>
            ))}
            {topDomains.length === 0 && <div className="text-xs text-slate-500">No activity yet.</div>}
          </div>
          {topDomains.length > 0 && (
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topDomains} dataKey="seconds" nameKey="domain" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {topDomains.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
