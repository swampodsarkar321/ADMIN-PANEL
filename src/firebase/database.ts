import { ref, onValue, push, set, update, remove, serverTimestamp } from 'firebase/database';
import { db } from './config';

export type OpenTab = {
  tabId: number;
  windowId: number;
  index: number;
  title: string;
  url: string;
  domain: string;
  active: boolean;
};

export type BrowserSession = {
  startedAt: number;
  uptimeSeconds: number;
  updatedAt: number;
};

export type Device = {
  id: string;
  name: string;
  browser: string;
  os: string;
  extensionVersion: string;
  online: boolean;
  lastSeen: number;
  enrolledAt?: number;
  openTabs?: Record<string, OpenTab>;
  openTabsCount?: number;
  openTabsUpdatedAt?: number;
  browserSession?: BrowserSession;
  currentTab?: {
    tabId?: number;
    title: string;
    url: string;
    domain: string;
    startedAt: number;
    activeSeconds?: number;
    status?: string;
    updatedAt?: number;
  };
  lastBlocked?: { domain: string; url: string; rule: string; at: number };
};

export type ActivityEntry = {
  id: string;
  deviceId: string;
  title: string;
  url: string;
  domain: string;
  seconds: number;
  timestamp: number;
  endTime?: number;
};

export type BlockRule = {
  id: string;
  scope: 'global' | string; // 'global' or deviceId
  pattern: string;
  enabled: boolean;
  type?: string;
  createdAt?: number;
  createdBy?: string;
};

export type Command = {
  id: string;
  deviceId: string;
  type: string;
  url: string;
  title?: string;
  message?: string;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  createdAt: number;
  executedAt?: number;
  createdBy?: string;
  error?: string;
};

export const OFFLINE_AFTER_MS = 3 * 60 * 1000;
export const isOnline = (d: Device) =>
  !!d.online && Date.now() - (d.lastSeen || 0) < OFFLINE_AFTER_MS;

export function subscribeDevices(cb: (d: Device[]) => void) {
  return onValue(ref(db, 'browserGuard/devices'), (snap) => {
    const v = snap.val() || {};
    cb(
      Object.entries<any>(v).map(([id, r]) => ({
        id,
        name: r.name || id,
        browser: r.browser || '—',
        os: r.os || '—',
        extensionVersion: r.extensionVersion || '—',
        online: !!r.online,
        lastSeen: r.lastSeen || 0,
        enrolledAt: r.enrolledAt,
        openTabs: r.openTabs,
        openTabsCount: r.openTabsCount,
        openTabsUpdatedAt: r.openTabsUpdatedAt,
        browserSession: r.browserSession,
        currentTab: r.currentTab,
        lastBlocked: r.lastBlocked,
      })),
    );
  });
}

export function subscribeActivity(deviceId: string | null, cb: (a: ActivityEntry[]) => void, limit = 500) {
  const path = deviceId ? `browserGuard/activity/${deviceId}` : 'browserGuard/activity';
  return onValue(ref(db, path), (snap) => {
    const v = snap.val() || {};
    const out: ActivityEntry[] = [];
    if (deviceId) {
      for (const [id, r] of Object.entries<any>(v)) {
        out.push({ id, deviceId, title: r.title || '', url: r.url || '', domain: r.domain || '', seconds: r.seconds || 0, timestamp: r.timestamp || 0, endTime: r.endTime });
      }
    } else {
      for (const [dev, entries] of Object.entries<any>(v)) {
        if (!entries || typeof entries !== 'object') continue;
        for (const [id, r] of Object.entries<any>(entries)) {
          out.push({ id, deviceId: dev, title: r.title || '', url: r.url || '', domain: r.domain || '', seconds: r.seconds || 0, timestamp: r.timestamp || 0, endTime: r.endTime });
        }
      }
    }
    out.sort((a, b) => b.timestamp - a.timestamp);
    cb(out.slice(0, limit));
  });
}

export function subscribeRules(cb: (r: BlockRule[]) => void) {
  return onValue(ref(db, 'browserGuard/blockedRules'), (snap) => {
    const v = snap.val() || {};
    const out: BlockRule[] = [];
    for (const [scope, rules] of Object.entries<any>(v)) {
      if (!rules || typeof rules !== 'object') continue;
      for (const [id, r] of Object.entries<any>(rules)) {
        out.push({ id, scope, pattern: r.pattern || '', enabled: r.enabled !== false, type: r.type, createdAt: r.createdAt, createdBy: r.createdBy });
      }
    }
    out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cb(out);
  });
}

export function subscribeCommands(deviceId: string | null, cb: (c: Command[]) => void) {
  const path = deviceId ? `browserGuard/commands/${deviceId}` : 'browserGuard/commands';
  return onValue(ref(db, path), (snap) => {
    const v = snap.val() || {};
    const out: Command[] = [];
    const pushRow = (dev: string, id: string, r: any) =>
      out.push({ id, deviceId: dev, type: r.type || 'CLOSE_TAB', url: r.url || r.pattern || '', title: r.title, message: r.message, status: r.status || 'pending', createdAt: r.createdAt || 0, executedAt: r.executedAt, createdBy: r.createdBy, error: r.error });
    if (deviceId) {
      for (const [id, r] of Object.entries<any>(v)) pushRow(deviceId, id, r);
    } else {
      for (const [dev, cmds] of Object.entries<any>(v)) {
        if (!cmds || typeof cmds !== 'object') continue;
        for (const [id, r] of Object.entries<any>(cmds)) pushRow(dev, id, r);
      }
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    cb(out.slice(0, 200));
  });
}

export async function addBlockRule(scope: string, pattern: string, by?: string) {
  const listRef = ref(db, `browserGuard/blockedRules/${scope}`);
  const child = push(listRef);
  await set(child, { pattern, enabled: true, createdAt: Date.now(), createdBy: by || 'admin' });
}

export async function toggleBlockRule(scope: string, id: string, enabled: boolean) {
  await update(ref(db, `browserGuard/blockedRules/${scope}/${id}`), { enabled });
}

export async function deleteBlockRule(scope: string, id: string) {
  await remove(ref(db, `browserGuard/blockedRules/${scope}/${id}`));
}

export async function sendCloseTab(deviceId: string, url: string, by?: string) {
  const listRef = ref(db, `browserGuard/commands/${deviceId}`);
  const child = push(listRef);
  await set(child, { type: 'CLOSE_TAB', url, status: 'pending', createdAt: Date.now(), createdBy: by || 'admin' });
  return child.key;
}

export async function sendNotify(deviceId: string, title: string, message: string, by?: string) {
  const listRef = ref(db, `browserGuard/commands/${deviceId}`);
  const child = push(listRef);
  await set(child, { type: 'NOTIFY', title, message, status: 'pending', createdAt: Date.now(), createdBy: by || 'admin' });
  return child.key;
}

export async function removeDevice(deviceId: string) {
  await remove(ref(db, `browserGuard/devices/${deviceId}`));
}

export async function cancelCommand(deviceId: string, id: string) {
  await update(ref(db, `browserGuard/commands/${deviceId}/${id}`), { status: 'cancelled' });
}

/* ------------------------------- quotas ---------------------------------- */

export type Quota = {
  id: string;
  scope: 'global' | string;
  domain: string;
  minutes: number;
  enabled: boolean;
  createdAt?: number;
  createdBy?: string;
};

export function subscribeQuotas(cb: (q: Quota[]) => void) {
  return onValue(ref(db, 'browserGuard/quotas'), (snap) => {
    const v = snap.val() || {};
    const out: Quota[] = [];
    for (const [scope, items] of Object.entries<any>(v)) {
      if (!items || typeof items !== 'object') continue;
      for (const [id, q] of Object.entries<any>(items)) {
        out.push({ id, scope, domain: String(q.domain || '').toLowerCase(), minutes: Number(q.minutes || 0), enabled: q.enabled !== false, createdAt: q.createdAt, createdBy: q.createdBy });
      }
    }
    out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cb(out);
  });
}

export async function addQuota(scope: string, domain: string, minutes: number, by?: string) {
  const child = push(ref(db, `browserGuard/quotas/${scope}`));
  await set(child, { domain: domain.trim().toLowerCase(), minutes, enabled: true, createdAt: Date.now(), createdBy: by || 'admin' });
}

export async function toggleQuota(scope: string, id: string, enabled: boolean) {
  await update(ref(db, `browserGuard/quotas/${scope}/${id}`), { enabled });
}

export async function deleteQuota(scope: string, id: string) {
  await remove(ref(db, `browserGuard/quotas/${scope}/${id}`));
}

/* ---------------------------- temp unblocks ------------------------------ */

export type TempUnblock = {
  id: string;
  scope: 'global' | string;
  pattern: string;
  until: number;
  createdAt?: number;
  createdBy?: string;
};

export function subscribeUnblocks(cb: (u: TempUnblock[]) => void) {
  return onValue(ref(db, 'browserGuard/tempUnblocks'), (snap) => {
    const v = snap.val() || {};
    const out: TempUnblock[] = [];
    for (const [scope, items] of Object.entries<any>(v)) {
      if (!items || typeof items !== 'object') continue;
      for (const [id, u] of Object.entries<any>(items)) {
        out.push({ id, scope, pattern: u.pattern || '', until: u.until || 0, createdAt: u.createdAt, createdBy: u.createdBy });
      }
    }
    out.sort((a, b) => a.until - b.until);
    cb(out);
  });
}

export async function addTempUnblock(scope: string, pattern: string, durationMin: number, by?: string) {
  const child = push(ref(db, `browserGuard/tempUnblocks/${scope}`));
  await set(child, { pattern: pattern.trim(), until: Date.now() + durationMin * 60000, createdAt: Date.now(), createdBy: by || 'admin' });
}

export async function revokeTempUnblock(scope: string, id: string) {
  await remove(ref(db, `browserGuard/tempUnblocks/${scope}/${id}`));
}

/* ---------------------------- block events ------------------------------- */

export type BlockEvent = {
  id: string;
  deviceId: string;
  domain: string;
  url: string;
  rule: string;
  kind: string;
  at: number;
};

export function subscribeBlockEvents(deviceId: string | null, cb: (e: BlockEvent[]) => void, limit = 300) {
  const path = deviceId ? `browserGuard/blockEvents/${deviceId}` : 'browserGuard/blockEvents';
  return onValue(ref(db, path), (snap) => {
    const v = snap.val() || {};
    const out: BlockEvent[] = [];
    const pushRow = (dev: string, id: string, r: any) =>
      out.push({ id, deviceId: dev, domain: r.domain || '', url: r.url || '', rule: r.rule || '', kind: r.kind || 'rule', at: r.at || 0 });
    if (deviceId) {
      for (const [id, r] of Object.entries<any>(v)) pushRow(deviceId, id, r);
    } else {
      for (const [dev, evs] of Object.entries<any>(v)) {
        if (!evs || typeof evs !== 'object') continue;
        for (const [id, r] of Object.entries<any>(evs)) pushRow(dev, id, r);
      }
    }
    out.sort((a, b) => b.at - a.at);
    cb(out.slice(0, limit));
  });
}

export { serverTimestamp };
