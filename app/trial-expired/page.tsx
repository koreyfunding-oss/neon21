'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TrialExpiredPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubscribe(plan: 'basic' | 'premium') {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, plan }),
      });
      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--void)' }}>
      <div className="mb-12 text-center">
        <div className="font-orbitron text-5xl font-black neon-text tracking-widest mb-4">⏰ TRIAL EXPIRED</div>
        <div className="font-mono text-sm opacity-60">Your 1-hour free trial has ended</div>
      </div>

      <div className="glass w-full max-w-2xl p-12 mb-8">
        <p className="text-center mb-8 font-mono text-sm" style={{ color: 'var(--neon-cyan)' }}>
          To continue using NEON21, please select a subscription plan:
        </p>

        {error && (
          <div className="mb-6 p-3 border border-red-500 rounded font-mono text-xs text-red-400 text-center">
            [ERROR] {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-lg" style={{ border: '2px solid var(--neon-amber)' }}>
            <h3 className="font-orbitron text-xl neon-amber mb-2">BASIC</h3>
            <div className="font-orbitron text-3xl mb-4" style={{ color: 'var(--neon-amber)' }}>
              $9.99<span className="text-sm opacity-70">/month</span>
            </div>
            <ul className="text-sm space-y-2 mb-6 opacity-80 font-mono">
              <li>✓ Full card counting access</li>
              <li>✓ Running &amp; true count tracking</li>
              <li>✓ Basic strategy engine</li>
              <li>✓ Bet recommendations</li>
            </ul>
            <button
              onClick={() => handleSubscribe('basic')}
              disabled={loading}
              className="w-full font-orbitron text-xs font-bold py-3 rounded transition-opacity hover:opacity-80"
              style={{ background: 'var(--neon-amber)', color: 'var(--void)' }}
            >
              {loading ? 'PROCESSING...' : 'SUBSCRIBE — $9.99/mo'}
            </button>
          </div>

          <div className="p-6 rounded-lg" style={{ border: '2px solid var(--neon-magenta)' }}>
            <h3 className="font-orbitron text-xl neon-magenta mb-2">PREMIUM</h3>
            <div className="font-orbitron text-3xl mb-4" style={{ color: 'var(--neon-magenta)' }}>
              $19.99<span className="text-sm opacity-70">/month</span>
            </div>
            <ul className="text-sm space-y-2 mb-6 opacity-80 font-mono">
              <li>✓ Everything in BASIC</li>
              <li>✓ Voice command support</li>
              <li>✓ Camera card scan (OCR)</li>
              <li>✓ Advanced pattern detection</li>
            </ul>
            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loading}
              className="w-full font-orbitron text-xs font-bold py-3 rounded transition-opacity hover:opacity-80"
              style={{ background: 'var(--neon-magenta)', color: 'var(--void)' }}
            >
              {loading ? 'PROCESSING...' : 'SUBSCRIBE — $19.99/mo'}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="font-mono text-xs opacity-40 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--neon-cyan)' }}
      >
        Sign Out
      </button>
    </div>
  );
}
