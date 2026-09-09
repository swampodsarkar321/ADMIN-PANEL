import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useDevices } from '../hooks/useDevices';
import { useCommands } from '../hooks/useCommands';
import { sendNotify, isOnline } from '../firebase/database';
import { isValidNotify } from '../utils/validation';
import { useAuth } from '../firebase/auth';
import { fmtDateTime } from '../utils/format';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function Notifications({ notify }: { notify: (t: string) => void }) {
  const { devices, loading: dLoading } = useDevices();
  const { commands, loading: cLoading } = useCommands(null);
  const { user } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [title, setTitle] = useState('Browser Guard');
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const names = useMemo(() => new Map(devices.map((d) => [d.id, d.name])), [devices]);
  const sorted = useMemo(
    () => [...devices].sort((a, b) => Number(isOnline(b)) - Number(isOnline(a)) || a.name.localeCompare(b.name)),
    [devices],
  );
  const notes = useMemo(() => commands.filter((c) => c.type === 'NOTIFY').slice(0, 30), [commands]);

  if (dLoading || cLoading) return <LoadingState />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="glass space-y-3 p-5">
        <h3 className="font-bold">Send browser notification</h3>
        <div>
          <label className="text-xs text-slate-400">Device</label>
          <select className="input mt-1" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            <option value="" className="bg-[#0b1220]">— Select device —</option>
            {sorted.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0b1220]">
                {isOnline(d) ? '🟢' : '⚪'} {d.name} ({d.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Title</label>
          <input className="input mt-1" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Browser Guard" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Message</label>
          <textarea className="input mt-1 min-h-[90px] resize-y" maxLength={250} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Please close YouTube and return to work." />
          <div className="mt-1 text-right text-[11px] text-slate-500">{message.length}/250</div>
        </div>
        {err && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">{err}</div>}
        <button
          className="btn-primary w-full justify-center"
          disabled={busy}
          onClick={async () => {
            if (!deviceId) return setErr('Select a device first.');
            const v = isValidNotify(title, message);
            if (v) return setErr(v);
            setErr('');
            setBusy(true);
            try {
              await sendNotify(deviceId, title.trim() || 'Browser Guard', message.trim(), user?.email || 'admin');
              notify('Notification sent — arrives within ~1 min');
              setMessage('');
            } catch (e: any) {
              setErr(e?.message || 'Failed to send');
            } finally { setBusy(false); }
          }}
        >
          <Send size={15} /> {busy ? 'Sending…' : 'Send Notification'}
        </button>
        <p className="text-[11px] text-slate-500">Sob open tab-er upor floating banner + native toast ashbe (~1 min). Offline thakle pending hoye thakbe.</p>
      </div>

      <div className="glass p-5">
        <h3 className="font-bold">Recent notifications</h3>
        <div className="mt-2 max-h-[480px] space-y-1.5 overflow-y-auto scroll-thin">
          {notes.map((c) => (
            <div key={`${c.deviceId}-${c.id}`} className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate font-semibold text-slate-200">🔔 {c.title || 'Notification'}</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${c.status === 'executed' ? 'bg-emerald-500/15 text-emerald-300' : c.status === 'failed' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {c.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-0.5 text-slate-400">{c.message}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{names.get(c.deviceId) || c.deviceId} · {fmtDateTime(c.createdAt)}</div>
            </div>
          ))}
          {notes.length === 0 && <EmptyState title="No notifications yet" body="Send your first notification from the form." />}
        </div>
      </div>
    </div>
  );
}
