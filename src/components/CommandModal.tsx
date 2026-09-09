import { useState } from 'react';
import { X } from 'lucide-react';
import { sendCloseTab, type Device } from '../firebase/database';
import { isValidCloseUrl } from '../utils/validation';

export default function CommandModal({ device, onClose, notify }: { device: Device | null; onClose: () => void; notify: (t: string) => void }) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!device) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Close matching tab</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose}><X size={15} /></button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Device: <span className="text-slate-200">{device.name}</span> · Only tabs matching the value are closed.</p>
        <label className="mt-3 block text-xs text-slate-400">Domain / URL / keyword</label>
        <input className="input mt-1" placeholder="youtube.com or https://youtube.com/..." value={url} onChange={(e) => setUrl(e.target.value)} />
        {err && <div className="mt-1 text-xs text-rose-400">{err}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              const v = isValidCloseUrl(url);
              if (v) return setErr(v);
              setBusy(true);
              try {
                await sendCloseTab(device.id, url.trim());
                notify('Tab close command sent');
                onClose();
              } catch (e: any) {
                setErr(e?.message || 'Failed to send');
              } finally { setBusy(false); }
            }}
          >
            {busy ? 'Sending…' : 'Close Matching Tab'}
          </button>
        </div>
      </div>
    </div>
  );
}
