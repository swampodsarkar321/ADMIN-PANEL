import { useMemo, useState } from 'react';
import { useActivity } from '../hooks/useActivity';
import { useDevices } from '../hooks/useDevices';
import ActivityTable from '../components/ActivityTable';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import Pagination from '../components/Pagination';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { isOnline } from '../firebase/database';

const PAGE_SIZE = 25;

function inRange(ts: number, range: string): boolean {
  const now = new Date();
  if (range === 'today') {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    return ts >= s.getTime();
  }
  if (range === 'yesterday') {
    const s = new Date();
    s.setDate(now.getDate() - 1);
    s.setHours(0, 0, 0, 0);
    const e = new Date();
    e.setHours(0, 0, 0, 0);
    return ts >= s.getTime() && ts < e.getTime();
  }
  if (range === '7d') return ts >= Date.now() - 7 * 864e5;
  return true;
}

export default function LiveActivity() {
  const { activity, loading } = useActivity(null, 1000);
  const { devices } = useDevices();
  const [q, setQ] = useState('');
  const [devFilter, setDevFilter] = useState('all');
  const [range, setRange] = useState('all');
  const [page, setPage] = useState(1);

  const names = useMemo(() => new Map(devices.map((d) => [d.id, d.name])), [devices]);
  const onlineIds = useMemo(() => new Set(devices.filter(isOnline).map((d) => d.id)), [devices]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = activity.filter((a) => {
      if (devFilter === 'online' && !onlineIds.has(a.deviceId)) return false;
      if (devFilter !== 'all' && devFilter !== 'online' && a.deviceId !== devFilter) return false;
      if (!inRange(a.timestamp, range)) return false;
      if (!s) return true;
      return (
        a.title.toLowerCase().includes(s) ||
        a.domain.toLowerCase().includes(s) ||
        a.url.toLowerCase().includes(s) ||
        (names.get(a.deviceId) || '').toLowerCase().includes(s)
      );
    });
    return filtered;
  }, [activity, q, devFilter, range, names, onlineIds]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <LoadingState label="Subscribing to live activity…" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <FilterDropdown
          value={devFilter}
          onChange={(v) => { setDevFilter(v); setPage(1); }}
          options={[
            { value: 'all', label: 'All Devices' },
            { value: 'online', label: 'Online only' },
            ...devices.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <FilterDropdown
          value={range}
          onChange={(v) => { setRange(v); setPage(1); }}
          options={[
            { value: 'all', label: 'All time' },
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: '7d', label: 'Last 7 Days' },
          ]}
        />
      </div>
      <div className="text-xs text-slate-400">Live · {rows.length} sessions (auto-refreshing via Realtime Database listeners)</div>
      {pageRows.length === 0 ? (
        <EmptyState title="No activity" body="Activity appears here when enrolled browsers report tab changes." />
      ) : (
        <>
          <ActivityTable rows={pageRows} deviceNames={names} />
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
