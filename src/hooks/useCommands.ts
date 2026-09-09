import { useEffect, useState } from 'react';
import { subscribeCommands, type Command } from '../firebase/database';

export function useCommands(deviceId: string | null = null) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeCommands(deviceId, (c) => {
      setCommands(c);
      setLoading(false);
    });
    return () => unsub();
  }, [deviceId]);
  return { commands, loading };
}
