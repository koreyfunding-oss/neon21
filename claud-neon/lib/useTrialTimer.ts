'use client';
import { useState, useEffect, useCallback } from 'react';

const TRIAL_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function useTrialTimer(trialStartedAt: string | null) {
  const [timeRemaining, setTimeRemaining] = useState<number>(TRIAL_DURATION_MS);
  const [isExpired, setIsExpired] = useState(false);
  const [warned5, setWarned5] = useState(false);
  const [warned2, setWarned2] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'warning' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => {
    if (!trialStartedAt) return;

    const tick = () => {
      const elapsed = Date.now() - new Date(trialStartedAt).getTime();
      const remaining = Math.max(TRIAL_DURATION_MS - elapsed, 0);
      setTimeRemaining(remaining);

      const minutes = remaining / 60000;

      if (minutes <= 5 && !warned5) {
        setWarned5(true);
        showToast('⚠ 5 MINUTES REMAINING — Subscribe to continue', 'warning');
      }

      if (minutes <= 2 && !warned2) {
        setWarned2(true);
        showToast('🚨 2 MINUTES REMAINING — Session ending soon', 'error');
      }

      if (remaining === 0) {
        setIsExpired(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [trialStartedAt, warned5, warned2, showToast]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const percentRemaining = timeRemaining / TRIAL_DURATION_MS;

  return {
    timeRemaining,
    formatted: formatTime(timeRemaining),
    percentRemaining,
    isExpired,
    toast,
    status: percentRemaining > 0.08 ? 'ok' : percentRemaining > 0.03 ? 'warning' : 'critical'
  };
}
