import { useEffect, useState } from 'react';
import { subscribeQuotas, type Quota } from '../firebase/database';

export function useQuotas() {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeQuotas((q) => {
      setQuotas(q);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { quotas, loading };
}
