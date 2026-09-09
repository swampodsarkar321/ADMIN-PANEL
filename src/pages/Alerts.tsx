import { useMemo, useState } from 'react';
import { useBlockEvents } from '../hooks/useBlockEvents';
import { useDevices } from '../hooks/useDevices';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { fmtDateTime } from '../utils/format';
import { shortUrl } from '../utils/sanitize';

export default function Alerts() {
  const { events, loading } = useBlockEvents(null, 300);
  const { devices } = useDevices();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');

  const names = useMemo(() => new Map(devices.map((d) => [d.id, d.name])), [devices]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return events.filter((e) => {
      if (kind !== 'all' && e.kind !== kind) return false;
      if (!s) return true;
      return (
        e.domain.toLowerCase().includes(s) ||
        e.url.toLowerCase().includes(s) ||
        (e.rule || '').toLowerCase().includes(s) ||
        (names.get(e.deviceId) || '').toLowerCase().includes(s)
      );
    });
  }, [events, q, kind, names]);

  if (loading) return <LoadingState label="Loading blocked attempts…" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} placeholder="Search device, domain, rule…" />
        <FilterDropdown
          value={kind}
          onChange={setKind}
          options={[
            { value: 'all', label: 'All attempts' },
            { value: 'rule', label: 'Block rules' },
            { value: 'quota', label: 'Quota limits' },
          ]}
        />
      </div>
      <div className="text-xs text-slate-400">Live · {rows.length} blocked attempts (new attempts also pop up as toasts)</div>
      {rows.length === 0 ? (
        <EmptyState title="No blocked attempts" body="When a user opens a blocked or over-quota site, it is logged here in real time." />
      ) : (
        <div className="glass overflow-x-auto scroll-thin">
          <table className="table w-full min-w-[760px]">
            <thead><tr><th>Device</th><th>Domain</th><th>URL</th><th>Reason</th><th>Time</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={`${e.deviceId}-${e.id}`}>
                  <td className="font-medium">{names.get(e.deviceId) || e.deviceId}</td>
                  <td className="text-rose-300">⛔ {e.domain}</td>
                  <td className="max-w-[260px] truncate font-mono text-[12px] text-slate-400" title={e.url}>{shortUrl(e.url, 52)}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${e.kind === 'quota' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'}`}>
                      {e.kind === 'quota' ? 'QUOTA' : 'BLOCKED'}
                    </span>
                    <div className="mt-0.5 max-w-[200px] truncate text-[11px] text-slate-500" title={e.rule}>{e.rule}</div>
                  </td>
                  <td className="whitespace-nowrap text-slate-400">{fmtDateTime(e.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
