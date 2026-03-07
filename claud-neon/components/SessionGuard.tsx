'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTrialTimer } from '@/lib/useTrialTimer';

interface SessionGuardProps {
  children: React.ReactNode;
}

export default function SessionGuard({ children }: SessionGuardProps) {
  const router = useRouter();
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setReady(true); return; }
      supabase
        .from('profiles')
        .select('subscription_status,trial_started_at')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSubscriptionStatus(data.subscription_status);
            setTrialStartedAt(data.trial_started_at);
          }
          setReady(true);
        });
    });
  }, []);

  const { formatted, percentRemaining, isExpired, toast, status } = useTrialTimer(
    subscriptionStatus === 'trial' ? trialStartedAt : null
  );

  useEffect(() => {
    if (isExpired && subscriptionStatus === 'trial') {
      router.push('/trial-expired');
    }
  }, [isExpired, subscriptionStatus, router]);

  const showTimer = ready && subscriptionStatus === 'trial' && !isExpired;

  const barColor =
    status === 'critical' ? 'critical' :
    status === 'warning' ? 'warning' : '';

  const timerColor =
    status === 'critical' ? 'var(--neon-magenta)' :
    status === 'warning' ? 'var(--neon-amber)' :
    'var(--neon-cyan)';

  return (
    <>
      {showTimer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000 }}>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(0,238,255,0.1)' }}>
            <div
              className={`trial-bar${barColor ? ` ${barColor}` : ''}`}
              style={{ width: `${percentRemaining * 100}%` }}
            />
          </div>
          {/* Timer display */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '4px 0',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: timerColor,
              textShadow: `0 0 8px ${timerColor}`,
              background: 'rgba(3,7,18,0.85)',
              borderBottom: `1px solid ${timerColor}33`,
            }}
          >
            TRIAL: {formatted}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {children}
    </>
  );
}
