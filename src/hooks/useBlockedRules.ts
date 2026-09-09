import { useEffect, useState } from 'react';
import { subscribeRules, type BlockRule } from '../firebase/database';

export function useBlockedRules() {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeRules((r) => {
      setRules(r);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { rules, loading };
}
