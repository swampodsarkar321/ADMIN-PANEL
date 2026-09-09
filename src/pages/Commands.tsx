import { useMemo, useState } from 'react';
import { useCommands } from '../hooks/useCommands';
import { useDevices } from '../hooks/useDevices';
import { cancelCommand } from '../firebase/database';
import { fmtDateTime } from '../utils/format';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function Commands({ notify }: { notify: (t: string) => void }) {
  const { commands, loading } = useCommands(null);
  const { devices } = useDevices();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const names = useMemo(() => new Map(devices.map((d) => [d.id, d.name])), [devices]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return commands.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (!s) return true;
      return c.url.toLowerCase().includes(s) || (c.message || '').toLowerCase().includes(s) || (c.title || '').toLowerCase().includes(s) || (names.get(c.deviceId) || '').toLowerCase().includes(s);
    });
  }, [commands, q, status, names]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} placeholder="Search commands…" />
        <FilterDropdown
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'executed', label: 'Executed' },
            { value: 'failed', label: 'Failed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No commands" body="Send a close-tab command from a device page. Status updates here in real time." />
      ) : (
        <div className="glass overflow-x-auto scroll-thin">
          <table className="table w-full min-w-[760px]">
            <thead><tr><th>Device</th><th>Type</th><th>Target</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={`${c.deviceId}-${c.id}`}>
                  <td>{names.get(c.deviceId) || c.deviceId}</td>
                  <td className="font-mono text-xs">{c.type}</td>
                  <td className="max-w-[280px] truncate font-mono text-xs text-slate-400" title={c.message || c.url}>{c.type === 'NOTIFY' ? `🔔 ${c.title || ''} — ${c.message || ''}` : (c.url || '—')}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.status === 'executed' ? 'bg-emerald-500/15 text-emerald-300' : c.status === 'failed' ? 'bg-rose-500/15 text-rose-300' : c.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-500/15 text-slate-400'}`}>
                      {c.status.toUpperCase()}
                    </span>
                    {c.error && <div className="text-[11px] text-rose-400">{c.error}</div>}
                  </td>
                  <td className="whitespace-nowrap text-slate-400">{fmtDateTime(c.createdAt)}</td>
                  <td>
                    {c.status === 'pending' && (
                      <button
                        className="btn-ghost !py-1 text-xs"
                        onClick={async () => {
                          try {
                            await cancelCommand(c.deviceId, c.id);
                            notify('Command cancelled');
                          } catch (e: any) {
                            notify(`Cancel failed: ${e?.message || e}`);
                          }
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
