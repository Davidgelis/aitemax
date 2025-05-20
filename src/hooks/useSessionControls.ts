
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';

export const useSessionControls = () => {
  const { sessionExpiresAt, refreshSession, isOnline, reconnect } = useAuth();
  const [timer, setTimer] = useState('');
  const [aboutToExpire, setAboutToExpire] = useState(false);

  const calc = useCallback(() => {
    if (!sessionExpiresAt) return;
    const now = Date.now();
    const left = sessionExpiresAt.getTime() - now;
    if (left <= 0) return setTimer('Expired');
    setAboutToExpire(left < 5 * 60 * 1000); // <5 min
    const m = Math.floor(left / 60000).toString().padStart(2, '0');
    const s = Math.floor((left % 60000) / 1000).toString().padStart(2, '0');
    setTimer(`${m}:${s}`);
    if (left < 2 * 60 * 1000 && isOnline) refreshSession(); // proactive
  }, [sessionExpiresAt, refreshSession, isOnline]);

  useEffect(() => {
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [calc]);

  return { timer, aboutToExpire, refreshSession, isOnline, reconnect };
};
