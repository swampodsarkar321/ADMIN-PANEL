import { useEffect, useState } from 'react';
import { fmtDuration } from '../utils/format';
import type { BrowserSession } from '../firebase/database';

/** Live-ticking session timer. While `live`, extrapolates from updatedAt. */
export default function LiveUptime({ session, live, className = '' }: { session?: BrowserSession; live: boolean; className?: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!live || !session) return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [live, session?.startedAt]);

  if (!session || !session.startedAt) return <span className={className}>—</span>;
  const extra = live && session.updatedAt ? Math.max(0, Math.round((Date.now() - session.updatedAt) / 1000)) : 0;
  return (
    <span className={`font-mono ${className}`} title={`Browser open since ${new Date(session.startedAt).toLocaleString()}`}>
      {fmtDuration((session.uptimeSeconds || 0) + extra)}
    </span>
  );
}
