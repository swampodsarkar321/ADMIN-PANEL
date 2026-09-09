import { useEffect, useState } from 'react';
import { subscribeDevices, type Device } from '../firebase/database';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeDevices((d) => {
      setDevices(d);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { devices, loading };
}
