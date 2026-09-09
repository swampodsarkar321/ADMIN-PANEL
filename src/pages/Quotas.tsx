import { useMemo, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { useQuotas } from '../hooks/useQuotas';
import { useDevices } from '../hooks/useDevices';
import { useActivity } from '../hooks/useActivity';
import { addQuota, toggleQuota, deleteQuota } from '../firebase/database';
import { isValidQuota } from '../utils/validation';
import { fmtDuration } from '../utils/format';
import { useAuth } from '../firebase/auth';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Sum today's seconds for a quota domain across matching devices/activity. */
function usedToday(
  activity: { deviceId: string; domain: string; seconds: number; timestamp: number }[],
  quotaDomain: string,
  scope: string,
): number {
  const t0 = todayStart();
  let s = 0;
  for (const a of activity) {
    if (a.timestamp < t0) continue;
    if (scope !== 'global' && a.deviceId !== scope) continue;
    const h = (a.domain || '').toLowerCase();
    if (h === quotaDomain || h.endsWith('.' + quotaDomain)) s += a.seconds || 0;
  }
  return s;
}

export default function Quotas({ notify }: { notify: (t: string) => void }) {
  const { quotas, loading } = useQuotas();
  const { devices } = useDevices();
  const { activity } = useActivity(null, 2000);
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [scope, setScope] = useState('global');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState('');

  const names = useMemo(() => new Map(devices.map((d) => [d.id, d.name])), [devices]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      <div className="glass flex flex-wrap items-end gap-2 p-4">
        <div className="min-w-[180px] flex-1">
          <label className="text-xs text-slate-400">Domain (e.g. youtube.com — covers subdomains)</label>
          <input className="input mt-1 font-mono" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="youtube.com" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Daily limit (minutes)</label>
          <input className="input mt-1 !w-32" type="number" min={1} max={1440} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Scope</label>
          <select className="input mt-1 !w-auto" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="global" className="bg-[#0b1220]">All devices (global)</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0b1220]">{d.name}</option>
            ))}
          </select>
        </div>
        <button
          className="btn-primary"
          disabled={busy}
          onClick={async () => {
            const v = isValidQuota(domain, Number(minutes));
            if (v) return setErr(v);
            setErr('');
            setBusy(true);
            try {
              await addQuota(scope, domain, Math.round(Number(minutes)), user?.email || 'admin');
              notify('Quota added — enforced live by the extension');
              setDomain('');
            } catch (e: any) {
              setErr(e?.message || 'Failed to add quota');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Plus size={15} /> Add Quota
        </button>
      </div>
      {err && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">{err}</div>}

      {quotas.length === 0 ? (
        <EmptyState title="No quotas" body="Set a daily time limit per site. When a user crosses it, the site auto-blocks until midnight with a 'Daily limit reached' page." />
      ) : (
        <div className="glass overflow-x-auto scroll-thin">
          <table className="table w-full min-w-[720px]">
            <thead><tr><th>Domain</th><th>Scope</th><th>Limit</th><th>Used today</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {quotas.map((q) => {
                const used = usedToday(activity, q.domain, q.scope);
                const limit = q.minutes * 60;
                const pct = Math.min(100, Math.round((used / limit) * 100));
                const over = used >= limit;
                return (
                  <tr key={`${q.scope}-${q.id}`}>
                    <td className="font-mono text-[13px] text-slate-200">{q.domain}</td>
                    <td><span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">{q.scope === 'global' ? 'global' : names.get(q.scope) || q.scope}</span></td>
                    <td className="whitespace-nowrap">{fmtDuration(limit)}</td>
                    <td className="min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full rounded-full ${over ? 'bg-rose-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`font-mono text-[11px] ${over ? 'text-rose-300' : 'text-slate-400'}`}>{fmtDuration(used)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${q.enabled && !over ? 'bg-emerald-500/15 text-emerald-300' : over ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-500/15 text-slate-400'}`}>
                        {over ? 'LIMIT HIT' : q.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost !px-2 !py-1.5" title="Enable/Disable" disabled={rowBusy === q.id}
                          onClick={async () => {
                            setRowBusy(q.id);
                            try {
                              await toggleQuota(q.scope, q.id, !q.enabled);
                              notify(q.enabled ? 'Quota disabled' : 'Quota enabled');
                            } catch (e: any) { notify(`Failed: ${e?.message || e}`); }
                            finally { setRowBusy(''); }
                          }}>
                          <Power size={14} />
                        </button>
                        <button className="btn-ghost !px-2 !py-1.5 hover:!border-rose-500/50" title="Delete" disabled={rowBusy === q.id}
                          onClick={async () => {
                            if (!confirm(`Delete quota for "${q.domain}"?`)) return;
                            setRowBusy(q.id);
                            try {
                              await deleteQuota(q.scope, q.id);
                              notify('Quota deleted');
                            } catch (e: any) { notify(`Delete failed: ${e?.message || e}`); }
                            finally { setRowBusy(''); }
                          }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-500">Usage resets every midnight (device local time). Extension tracks usage locally — "Used today" above is computed from reported activity and may lag a minute behind.</p>
    </div>
  );
}
