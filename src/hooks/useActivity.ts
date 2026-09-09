import { useEffect, useState } from 'react';
import { subscribeActivity, type ActivityEntry } from '../firebase/database';

export function useActivity(deviceId: string | null = null, limit = 500) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeActivity(deviceId, (a) => {
      setActivity(a);
      setLoading(false);
    }, limit);
    return () => unsub();
  }, [deviceId, limit]);
  return { activity, loading };
}
