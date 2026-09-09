import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, MonitorSmartphone } from 'lucide-react';
import { useDevices } from '../hooks/useDevices';
import { useActivity } from '../hooks/useActivity';
import { useCommands } from '../hooks/useCommands';
import { isOnline, removeDevice, sendCloseTab } from '../firebase/database';
import { fmtDuration, fmtDateTime, timeAgo } from '../utils/format';
import ActivityTimeline from '../components/ActivityTimeline';
import LiveUptime from '../components/LiveUptime';
import CommandModal from '../components/CommandModal';
import NotifyModal from '../components/NotifyModal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingState from '../components/LoadingState';
import { StatusDot } from '../components/DeviceCard';
import { isValidCloseUrl } from '../utils/validation';

export default function DeviceDetails({ notify }: { notify: (t: string) => void }) {
  const { id = '' } = useParams();
  const deviceId = decodeURIComponent(id);
  const { devices, loading: dLoading } = useDevices();
  const { activity, loading: aLoading } = useActivity(deviceId, 200);
  const { commands } = useCommands(deviceId);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const device = devices.find((d) => d.id === deviceId);
  if (dLoading) return <LoadingState />;
  if (!device) {
    return (
      <div className="space-y-3">
        <Link to="/devices" className="btn-ghost w-fit"><ArrowLeft size={14} /> Devices</Link>
        <div className="glass p-6 text-sm text-slate-400">Device <code className="font-mono text-sky-300">{deviceId}</code> not found. It may have been removed.</div>
      </div>
    );
  }

  const totalSec = activity.reduce((s, a) => s + (a.seconds || 0), 0);
  const liveSec = device.currentTab?.activeSeconds ?? (device.currentTab ? Math.round((Date.now() - device.currentTab.startedAt) / 1000) : 0);
  const openTabs = Object.values(device.openTabs || {}).sort(
    (a, b) => Number(b.active) - Number(a.active) || a.windowId - b.windowId || a.index - b.index,
  );

  return (
    <div className="space-y-3">
      <Link to="/devices" className="btn-ghost w-fit"><ArrowLeft size={14} /> Devices</Link>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="glass space-y-2 p-5 lg:col-span-1">
          <div className="flex items-center gap-2">
            <MonitorSmartphone size={18} className="text-sky-400" />
            <h2 className="text-lg font-bold">{device.name}</h2>
          </div>
          <div className="font-mono text-xs text-sky-300">{device.id}</div>
          <StatusDot device={device} />
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Browser session time</div>
            <div className="text-3xl font-extrabold text-emerald-300">
              <LiveUptime session={device.browserSession} live={isOnline(device)} />
            </div>
            <div className="text-[11px] text-slate-400">
              {device.browserSession?.startedAt ? `since ${fmtDateTime(device.browserSession.startedAt)}` : 'no session yet'}
            </div>
          </div>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Browser</dt><dd>{device.browser}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">OS</dt><dd>{device.os}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Extension</dt><dd>v{device.extensionVersion}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Last seen</dt><dd>{fmtDateTime(device.lastSeen)} ({timeAgo(device.lastSeen)})</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Online</dt><dd>{isOnline(device) ? 'Yes' : 'No'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Tracked total</dt><dd>{fmtDuration(totalSec)}</dd></div>
          </dl>
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1 justify-center" onClick={() => setCmdOpen(true)}>Close Tab…</button>
            <button className="btn-ghost" onClick={() => setNotifyOpen(true)}>Notify…</button>
            <button className="btn-ghost" onClick={() => setConfirmDelete(true)}>Remove</button>
          </div>
          {device.lastBlocked && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-200">
              Last blocked: {device.lastBlocked.domain} (rule: {device.lastBlocked.rule})
            </div>
          )}
        </div>

        <div className="glass p-5 lg:col-span-2">
          <h3 className="font-bold">Current Tab</h3>
          {device.currentTab && isOnline(device) ? (
            <div className="mt-2 space-y-1 text-sm">
              <div className="truncate text-base font-semibold" title={device.currentTab.url}>{device.currentTab.title}</div>
              <div className="truncate font-mono text-xs text-sky-300" title={device.currentTab.url}>{device.currentTab.url}</div>
              <div className="text-xs text-slate-400">Domain: {device.currentTab.domain} · Active: <span className="font-mono text-emerald-300">{fmtDuration(liveSec)}</span> · STATUS: ACTIVE</div>
              <div className="mt-3 flex gap-2">
                <input className="input" placeholder="Quick close: paste domain/URL from above" value={quickUrl} onChange={(e) => setQuickUrl(e.target.value)} />
                <button
                  className="btn-primary whitespace-nowrap"
                  onClick={async () => {
                    const v = isValidCloseUrl(quickUrl || device.currentTab?.url || '');
                    if (v) return notify(v);
                    await sendCloseTab(device.id, (quickUrl || device.currentTab?.url || '').trim());
                    notify('Tab close command sent');
                    setQuickUrl('');
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">No live tab — device is offline or idle.</div>
          )}

          <h3 className="mt-5 font-bold">Recent Activity</h3>
          <div className="mt-3">
            {aLoading ? <LoadingState label="Loading activity…" /> : <ActivityTimeline rows={activity} />}
          </div>
        </div>
      </div>

      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Open Tabs ({device.openTabsCount ?? openTabs.length})</h3>
          {device.openTabsUpdatedAt ? (
            <span className="text-[11px] text-slate-500">updated {timeAgo(device.openTabsUpdatedAt)}</span>
          ) : null}
        </div>
        <div className="mt-2 max-h-96 space-y-1.5 overflow-y-auto scroll-thin">
          {openTabs.map((t) => (
            <div key={`${t.windowId}-${t.tabId}`} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
              {t.active && (
                <span className="whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">ACTIVE</span>
              )}
              <span className="hidden whitespace-nowrap font-mono text-slate-500 sm:inline">W{t.windowId}·T{t.tabId}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-200" title={t.url}>{t.title}</div>
                <div className="truncate font-mono text-[11px] text-slate-500" title={t.url}>{t.domain} — {t.url}</div>
              </div>
              <button
                className="btn-ghost shrink-0 !py-1 text-[11px]"
                onClick={async () => {
                  await sendCloseTab(device.id, t.url);
                  notify(`Close command sent: ${t.domain}`);
                }}
              >
                Close
              </button>
            </div>
          ))}
          {openTabs.length === 0 && (
            <div className="text-slate-500">No open tabs reported — device may be offline or running an old extension version.</div>
          )}
        </div>
      </div>

      <div className="glass p-4">
        <h3 className="font-bold">Recent Commands</h3>
        <div className="mt-2 space-y-1.5 text-xs">
          {commands.slice(0, 10).map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="font-mono text-slate-300">{c.type}</span>
              <span className="flex-1 truncate text-slate-400" title={c.message || c.url}>{c.type === 'NOTIFY' ? `🔔 ${c.title || ''} — ${c.message || ''}` : c.url}</span>
              <span className={`rounded-full px-2 py-0.5 font-semibold ${c.status === 'executed' ? 'bg-emerald-500/15 text-emerald-300' : c.status === 'failed' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>
                {c.status.toUpperCase()}
              </span>
              <span className="text-slate-500">{fmtDateTime(c.createdAt)}</span>
            </div>
          ))}
          {commands.length === 0 && <div className="text-slate-500">No commands yet.</div>}
        </div>
      </div>

      {cmdOpen && <CommandModal device={device} onClose={() => setCmdOpen(false)} notify={notify} />}
      {notifyOpen && <NotifyModal device={device} onClose={() => setNotifyOpen(false)} notify={notify} />}
      {confirmDelete && (
        <ConfirmModal
          title="Remove device?"
          body={`Remove ${device.name} (${device.id}) from the dashboard? Activity history is kept unless deleted manually.`}
          confirmLabel="Remove"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            try {
              await removeDevice(device.id);
              notify('Device removed');
              setConfirmDelete(false);
              history.back();
            } catch (e: any) {
              notify(`Remove failed: ${e?.message || e}`);
            }
          }}
        />
      )}
    </div>
  );
}
