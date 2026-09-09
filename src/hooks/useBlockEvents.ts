import { useEffect, useState } from 'react';
import { subscribeBlockEvents, type BlockEvent } from '../firebase/database';

export function useBlockEvents(deviceId: string | null = null, limit = 300) {
  const [events, setEvents] = useState<BlockEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeBlockEvents(deviceId, (e) => {
      setEvents(e);
      setLoading(false);
    }, limit);
    return () => unsub();
  }, [deviceId, limit]);
  return { events, loading };
}
