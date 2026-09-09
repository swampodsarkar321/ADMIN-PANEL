import { Pencil, Trash2, Power } from 'lucide-react';
import { toggleBlockRule, deleteBlockRule, type BlockRule } from '../firebase/database';
import { useState } from 'react';

export default function BlockedRuleTable({ rules, onEdit, notify }: { rules: BlockRule[]; onEdit: (r: BlockRule) => void; notify: (t: string) => void }) {
  const [busy, setBusy] = useState('');
  return (
    <div className="glass overflow-x-auto scroll-thin">
      <table className="table w-full min-w-[640px]">
        <thead><tr><th>Pattern</th><th>Scope</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>
          {rules.map((r) => (
            <tr key={`${r.scope}-${r.id}`} className="hover:bg-white/[0.02]">
              <td className="font-mono text-[13px] text-slate-200">{r.pattern}</td>
              <td><span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">{r.scope}</span></td>
              <td>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.enabled ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-500/15 text-slate-400'}`}>
                  {r.enabled ? 'Blocked' : 'Disabled'}
                </span>
              </td>
              <td>
                <div className="flex justify-end gap-1">
                  <button className="btn-ghost !px-2 !py-1.5" title="Enable/Disable" disabled={busy === r.id}
                    onClick={async () => {
                      setBusy(r.id);
                      try {
                        await toggleBlockRule(r.scope, r.id, !r.enabled);
                        notify(r.enabled ? 'Rule disabled — lifts on next page load' : 'Rule enabled');
                      } catch (e: any) {
                        notify(`Failed: ${e?.message || e}`);
                      } finally { setBusy(''); }
                    }}>
                    <Power size={14} />
                  </button>
                  <button className="btn-ghost !px-2 !py-1.5" title="Edit" onClick={() => onEdit(r)}><Pencil size={14} /></button>
                  <button className="btn-ghost !px-2 !py-1.5 hover:!border-rose-500/50" title="Delete" disabled={busy === r.id}
                    onClick={async () => {
                      if (!confirm(`Delete rule "${r.pattern}"?`)) return;
                      setBusy(r.id);
                      try {
                        await deleteBlockRule(r.scope, r.id);
                        notify('Rule deleted — lifts on next page load');
                      } catch (e: any) {
                        notify(`Delete failed: ${e?.message || e}`);
                      } finally { setBusy(''); }
                    }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
