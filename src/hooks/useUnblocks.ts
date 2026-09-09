import { useEffect, useState } from 'react';
import { subscribeUnblocks, type TempUnblock } from '../firebase/database';

export function useUnblocks() {
  const [unblocks, setUnblocks] = useState<TempUnblock[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeUnblocks((u) => {
      setUnblocks(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { unblocks, loading };
}
