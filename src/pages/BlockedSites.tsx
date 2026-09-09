import { useEffect, useMemo, useState } from 'react';
import { Plus, Timer, X } from 'lucide-react';
import { useBlockedRules } from '../hooks/useBlockedRules';
import { useDevices } from '../hooks/useDevices';
import { useUnblocks } from '../hooks/useUnblocks';
import { addBlockRule, deleteBlockRule, addTempUnblock, revokeTempUnblock } from '../firebase/database';
import { fmtDuration } from '../utils/format';
import BlockedRuleTable from '../components/BlockedRuleTable';
import SearchBar from '../components/SearchBar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { isValidBlockPattern } from '../utils/validation';
import { useAuth } from '../firebase/auth';

export default function BlockedSites({ notify }: { notify: (t: string) => void }) {
  const { rules, loading } = useBlockedRules();
  const { devices } = useDevices();
  const { user } = useAuth();
  const [pattern, setPattern] = useState('');
  const [scope, setScope] = useState('global');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ scope: string; id: string; pattern: string } | null>(null);
  const { unblocks } = useUnblocks();
  const [upattern, setUpattern] = useState('');
  const [uduration, setUduration] = useState('30');
  const [uscope, setUscope] = useState('global');
  const [, setTick] = useState(0);

  // Re-render countdowns every 30s
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(i);
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rules;
    return rules.filter((r) => r.pattern.toLowerCase().includes(s) || r.scope.toLowerCase().includes(s));
  }, [rules, q]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      <div className="glass flex flex-wrap items-end gap-2 p-4">
        <div className="min-w-[220px] flex-1">
          <label className="text-xs text-slate-400">New rule — domain, keyword or URL (e.g. youtube.com, /games, https://example.com/page)</label>
          <input className="input mt-1" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="youtube.com" />
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
            const v = isValidBlockPattern(pattern);
            if (v) return setErr(v);
            setErr('');
            setBusy(true);
            try {
              await addBlockRule(scope, pattern.trim(), user?.email || 'admin');
              notify('Block rule added');
              setPattern('');
            } catch (e: any) {
              setErr(e?.message || 'Failed to add rule');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Plus size={15} /> Add Block Rule
        </button>
      </div>
      <div className="glass p-4">
        <h3 className="flex items-center gap-2 font-bold"><Timer size={16} className="text-emerald-300" /> Temporary Unblock</h3>
        <p className="mt-0.5 text-[11px] text-slate-400">Grant time-bound access that overrides block rules + quotas. Applies on next page load.</p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1">
            <input className="input" value={upattern} onChange={(e) => setUpattern(e.target.value)} placeholder="youtube.com" />
          </div>
          <select className="input !w-auto" value={uduration} onChange={(e) => setUduration(e.target.value)}>
            <option value="15" className="bg-[#0b1220]">15 min</option>
            <option value="30" className="bg-[#0b1220]">30 min</option>
            <option value="60" className="bg-[#0b1220]">1 hour</option>
            <option value="120" className="bg-[#0b1220]">2 hours</option>
          </select>
          <select className="input !w-auto" value={uscope} onChange={(e) => setUscope(e.target.value)}>
            <option value="global" className="bg-[#0b1220]">All devices</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0b1220]">{d.name}</option>
            ))}
          </select>
          <button
            className="btn-primary !bg-emerald-500 hover:!bg-emerald-400"
            disabled={busy}
            onClick={async () => {
              const v = isValidBlockPattern(upattern);
              if (v) return notify(v);
              setBusy(true);
              try {
                await addTempUnblock(uscope, upattern, Number(uduration), user?.email || 'admin');
                notify(`Unblocked for ${uduration} min`);
                setUpattern('');
              } catch (e: any) {
                notify(e?.message || 'Failed');
              } finally { setBusy(false); }
            }}
          >
            Grant Access
          </button>
        </div>
        {unblocks.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {unblocks.map((u) => {
              const left = Math.round((u.until - Date.now()) / 1000);
              const expired = left <= 0;
              return (
                <div key={`${u.scope}-${u.id}`} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                  <span className="font-mono text-slate-200">{u.pattern}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">{u.scope === 'global' ? 'global' : u.scope}</span>
                  <span className={`flex-1 text-right font-mono text-[11px] ${expired ? 'text-slate-500' : 'text-emerald-300'}`}>
                    {expired ? 'expired' : `${fmtDuration(left)} left`}
                  </span>
                  <button
                    className="btn-ghost !px-2 !py-1 text-[11px]"
                    onClick={async () => {
                      try {
                        await revokeTempUnblock(u.scope, u.id);
                        notify('Temporary access revoked');
                      } catch (e: any) { notify(`Failed: ${e?.message || e}`); }
                    }}
                  >
                    <X size={13} /> Revoke
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] leading-relaxed text-slate-400">
        Tip: <code className="font-mono text-sky-300">youtube.com</code> দিলে সব YouTube page + subdomain (www, m, music, consent) block হবে — full URL paste করার দরকার নেই। Block/unblock প্রতিটা navigation-এ fresh check হয়, তাই সাথে সাথে কার্যকর হয়।
      </div>
      {err && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">{err}</div>}

      <SearchBar value={q} onChange={setQ} placeholder="Search rules…" />

      {rows.length === 0 ? (
        <EmptyState title="No block rules" body="Add your first rule above. Extensions enforce enabled rules within ~60 seconds." />
      ) : (
        <BlockedRuleTable rules={rows} notify={notify} onEdit={(r) => setEditing({ scope: r.scope, id: r.id, pattern: r.pattern })} />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="glass w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">Edit rule</h3>
            <input className="input mt-2" value={editing.pattern} onChange={(e) => setEditing({ ...editing, pattern: e.target.value })} />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  const v = isValidBlockPattern(editing.pattern);
                  if (v) return notify(v);
                  try {
                    await deleteBlockRule(editing.scope, editing.id);
                    await addBlockRule(editing.scope, editing.pattern.trim(), user?.email || 'admin');
                    notify('Rule updated');
                    setEditing(null);
                  } catch (e: any) {
                    notify(`Update failed: ${e?.message || e}`);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
