import { useState } from 'react';
import { X, Bell } from 'lucide-react';
import { sendNotify, type Device } from '../firebase/database';
import { isValidNotify } from '../utils/validation';
import { useAuth } from '../firebase/auth';

export default function NotifyModal({ device, onClose, notify }: { device: Device | null; onClose: () => void; notify: (t: string) => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('Browser Guard');
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!device) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold"><Bell size={16} className="text-amber-300" /> Send notification</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose}><X size={15} /></button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          To: <span className="text-slate-200">{device.name}</span> · Shows as a floating banner on every open tab + native notification (~1 min).
        </p>
        <label className="mt-3 block text-xs text-slate-400">Title</label>
        <input className="input mt-1" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Browser Guard" />
        <label className="mt-2 block text-xs text-slate-400">Message</label>
        <textarea className="input mt-1 min-h-[80px] resize-y" maxLength={250} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Please close YouTube and return to work." />
        <div className="mt-1 text-right text-[11px] text-slate-500">{message.length}/250</div>
        {err && <div className="mt-1 text-xs text-rose-400">{err}</div>}
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              const v = isValidNotify(title, message);
              if (v) return setErr(v);
              setErr('');
              setBusy(true);
              try {
                await sendNotify(device.id, title.trim() || 'Browser Guard', message.trim(), user?.email || 'admin');
                notify('Notification sent');
                onClose();
              } catch (e: any) {
                setErr(e?.message || 'Failed to send');
              } finally { setBusy(false); }
            }}
          >
            {busy ? 'Sending…' : 'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
}
