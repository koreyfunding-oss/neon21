'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { username } }
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          // Create profile with trial start
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username,
            email,
            trial_started_at: new Date().toISOString(),
            subscription_status: 'trial'
          });
          setMessage('CHECK YOUR EMAIL to confirm your account.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--void)' }}>
      {/* Logo */}
      <div className="mb-12 text-center animate-boot">
        <div className="font-orbitron text-5xl font-black neon-text tracking-widest mb-2">NEON21</div>
        <div className="font-mono text-xs tracking-[0.3em] opacity-50 uppercase">CIS Intelligence System</div>
        <div className="font-mono text-xs tracking-[0.2em] opacity-30 mt-1">by Syndicate Supremacy</div>
      </div>

      {/* Auth card */}
      <div className="glass w-full max-w-sm p-8 animate-boot" style={{ animationDelay: '0.1s' }}>
        {/* Mode toggle */}
        <div className="flex mb-8 border border-[var(--glass-border)] rounded overflow-hidden">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setMessage(''); }}
              className="flex-1 py-2 font-orbitron text-xs font-bold tracking-widest uppercase transition-all"
              style={{
                background: mode === m ? 'rgba(0,238,255,0.12)' : 'transparent',
                color: mode === m ? 'var(--neon-cyan)' : 'rgba(0,238,255,0.3)',
                borderRight: m === 'login' ? '1px solid var(--glass-border)' : 'none'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="font-mono text-xs opacity-50 tracking-widest uppercase block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--glass-border)] rounded px-3 py-2 font-mono text-sm text-[var(--neon-cyan)] outline-none focus:border-[var(--neon-cyan)] transition-colors"
                placeholder="AGENT_NAME"
              />
            </div>
          )}
          <div>
            <label className="font-mono text-xs opacity-50 tracking-widest uppercase block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border border-[var(--glass-border)] rounded px-3 py-2 font-mono text-sm text-[var(--neon-cyan)] outline-none focus:border-[var(--neon-cyan)] transition-colors"
              placeholder="operator@domain.com"
            />
          </div>
          <div>
            <label className="font-mono text-xs opacity-50 tracking-widest uppercase block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-transparent border border-[var(--glass-border)] rounded px-3 py-2 font-mono text-sm text-[var(--neon-cyan)] outline-none focus:border-[var(--neon-cyan)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="font-mono text-xs neon-magenta">[ERROR] {error}</p>}
          {message && <p className="font-mono text-xs neon-green">[OK] {message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-neon btn-neon-solid w-full mt-2"
          >
            {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ENTER SYSTEM' : 'INITIALIZE ACCOUNT'}
          </button>
        </form>

        {mode === 'login' && (
          <p className="font-mono text-xs opacity-30 text-center mt-6">
            NEW OPERATOR?{' '}
            <button onClick={() => setMode('signup')} className="opacity-100 text-[var(--neon-cyan)] underline">
              REQUEST ACCESS
            </button>
          </p>
        )}
      </div>

      {/* Trial info */}
      <div className="mt-6 font-mono text-xs opacity-20 text-center animate-boot" style={{ animationDelay: '0.2s' }}>
        FREE 1-HOUR TRIAL · THEN $9.99/MONTH
      </div>
    </div>
  );
}
