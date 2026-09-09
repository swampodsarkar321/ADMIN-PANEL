import { useMemo, useState } from 'react';
import { useDevices } from '../hooks/useDevices';
import DeviceTable from '../components/DeviceTable';
import DeviceCard from '../components/DeviceCard';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { isOnline } from '../firebase/database';

export default function Devices() {
  const { devices, loading } = useDevices();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return devices.filter((d) => {
      if (filter === 'online' && !isOnline(d)) return false;
      if (filter === 'offline' && isOnline(d)) return false;
      if (!s) return true;
      return (
        d.name.toLowerCase().includes(s) ||
        d.id.toLowerCase().includes(s) ||
        d.browser.toLowerCase().includes(s) ||
        (d.currentTab?.title || '').toLowerCase().includes(s) ||
        (d.currentTab?.domain || '').toLowerCase().includes(s)
      );
    });
  }, [devices, q, filter]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchBar value={q} onChange={setQ} placeholder="Search device, browser, tab…" />
        <FilterDropdown
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All Devices' },
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline' },
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No devices found" body="Enroll a browser by loading the extension and configuring the Firebase Database URL. It will appear here within a minute." />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
          <DeviceTable devices={rows} />
        </>
      )}
    </div>
  );
}
