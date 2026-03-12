'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTrialTimer } from '@/lib/useTrialTimer';
import { getVoiceEngine, VoiceCommand } from '@/lib/voice';
import { getScanEngine } from '@/lib/cardScan';

type CountSystem = 'hi-lo' | 'ko' | 'hi-opt-ii';
type NumDecks = 2 | 6 | 8;

const CARD_OPTIONS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SYSTEM_LABELS: Record<CountSystem, string> = {
  'hi-lo': 'Hi-Lo', 'ko': 'KO', 'hi-opt-ii': 'Hi-Opt II'
};

const ACTION_COLORS: Record<string, string> = {
  HIT: 'var(--neon-cyan)', STAND: 'var(--neon-amber)',
  DOUBLE: 'var(--neon-green)', SPLIT: 'var(--neon-magenta)', SURRENDER: '#ff4444'
};

interface GameState {
  runningCount: number;
  trueCount: number;
  cardsDealt: number;
  decksRemaining: number;
  penetration: number;
  bet: {
    recommendedBet: number;
    signal: string;
    signalColor: string;
    edge: number;
    riskOfRuin: number;
  };
  session: { winRate: number; handCount: number };
}

interface Prediction {
  actionLabel: string;
  trueCount: number;
  insurance: boolean;
  ev: { stand: number; hit: number };
  deviation: { play: string; action: string } | null;
  confidence: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{ username: string; subscription_status: string; trial_started_at: string } | null>(null);
  const [system, setSystem] = useState<CountSystem>('hi-lo');
  const [numDecks, setNumDecks] = useState<NumDecks>(6);
  const [minBet, setMinBet] = useState(25);
  const [maxBet, setMaxBet] = useState(500);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [playerTotal, setPlayerTotal] = useState('');
  const [dealerUpcard, setDealerUpcard] = useState('');
  const [isSoft, setIsSoft] = useState(false);
  const [isPair, setIsPair] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [scanActive, setScanActive] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [recentCards, setRecentCards] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionId = useRef<string>(`neon21-${Date.now()}`);

  const { formatted, percentRemaining, isExpired, toast, status: timerStatus } = useTrialTimer(
    profile?.trial_started_at || null
  );

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return; }
      setUser({ id: user.id, email: user.email || '' });
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            if (!localStorage.getItem('neon21_walkthrough_done')) {
              setShowWalkthrough(true);
            }
          }
        });
    });
  }, [router]);

  // Trial expiry
  useEffect(() => {
    if (isExpired && profile?.subscription_status === 'trial') {
      setShowPaywall(true);
    }
  }, [isExpired, profile]);

  // Notify helper
  const notify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Add card to count
  const addCard = useCallback(async (card: string) => {
    try {
      const res = await fetch('/api/engine/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId.current },
        body: JSON.stringify({ card, numDecks, system, minBet, maxBet })
      });
      const data = await res.json();
      if (data.state) setGameState(data.state.count && { ...data.state.count, ...data.state });
      setRecentCards(prev => [card, ...prev].slice(0, 20));
      notify(`CARD LOGGED: ${card}`);
    } catch { notify('ENGINE ERROR'); }
  }, [numDecks, system, minBet, maxBet, notify]);

  // Get prediction
  async function getPrediction() {
    if (!playerTotal || !dealerUpcard) return;
    setLoading(true);
    try {
      const res = await fetch('/api/engine/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId.current },
        body: JSON.stringify({ playerTotal: parseInt(playerTotal), dealerUpcard, isSoft, isPair })
      });
      const data = await res.json();
      setPrediction(data);
    } catch { notify('PREDICTION ERROR'); }
    setLoading(false);
  }

  // Reset shoe
  async function resetShoe() {
    await fetch('/api/engine/reset', {
      method: 'POST',
      headers: { 'x-session-id': sessionId.current }
    });
    setGameState(null);
    setRecentCards([]);
    notify('SHOE RESET — NEW SHUFFLE');
  }

  // Voice control
  function toggleVoice() {
    const engine = getVoiceEngine();
    if (!engine.isSupported()) { notify('Voice not supported on this device'); return; }

    if (voiceActive) {
      engine.stopListening();
      setVoiceActive(false);
      setVoiceTranscript('');
    } else {
      engine.startListening(
        (cmd: VoiceCommand) => {
          if (cmd.type === 'ADD_CARD') addCard(cmd.card);
          else if (cmd.type === 'HIT') notify('VOICE: HIT');
          else if (cmd.type === 'STAND') notify('VOICE: STAND');
          else if (cmd.type === 'DOUBLE') notify('VOICE: DOUBLE');
          else if (cmd.type === 'RESET_SHOE') resetShoe();
        },
        (t, final) => setVoiceTranscript(final ? '' : t)
      );
      setVoiceActive(true);
      notify('VOICE ACTIVE — Speak card names');
    }
  }

  // Scan control
  async function toggleScan() {
    const engine = getScanEngine();
    if (scanActive) {
      engine.stopScan();
      await engine.stopCamera();
      setScanActive(false);
    } else {
      await engine.initialize();
      if (videoRef.current && canvasRef.current) {
        const ok = await engine.startCamera(videoRef.current, canvasRef.current);
        if (!ok) { notify('Camera access denied'); return; }
        engine.startContinuousScan(
          (card) => { addCard(card); notify(`SCAN DETECTED: ${card}`); },
          undefined,
          2000 // poll every 2 seconds
        );
        setScanActive(true);
      }
    }
  }

  // Walkthrough steps
  const WALKTHROUGH = [
    { title: 'WELCOME TO NEON21', body: 'Your AI-powered blackjack intelligence system. This walkthrough will get you operational in 60 seconds.' },
    { title: 'CARD COUNTING', body: 'Tap card buttons or use voice/scan to log cards. NEON21 tracks running count and true count automatically.' },
    { title: 'GET PREDICTIONS', body: 'Enter your hand total and dealer upcard — NEON21 will tell you exactly what to do, adjusted for the count.' },
    { title: 'VOICE MODE', body: 'In loud environments, activate voice mode. Say card names like "king", "five", or "ace" to log cards hands-free.' },
    { title: 'SCAN MODE', body: 'Point your camera at the table. NEON21 will detect new cards automatically using computer vision.' },
    { title: 'YOU\'RE READY', body: 'Good luck, operator. Trust the system. The math is always in your favor when you play correctly.' },
  ];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-orbitron text-sm tracking-widest animate-pulse-glow">AUTHENTICATING...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>

      {/* Trial timer bar */}
      <div style={{ height: 3, background: 'rgba(0,238,255,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div
          className={`trial-bar ${timerStatus === 'warning' ? 'warning' : timerStatus === 'critical' ? 'critical' : ''}`}
          style={{ width: `${percentRemaining * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between py-4 border-b border-[var(--glass-border)]">
        <div className="font-orbitron font-black text-xl neon-text tracking-widest">NEON21</div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs opacity-50">
            {profile?.username || user.email.split('@')[0]}
          </div>
          <div className={`font-mono text-xs ${timerStatus === 'critical' ? 'neon-magenta animate-pulse-glow' : timerStatus === 'warning' ? 'neon-amber' : 'opacity-50'}`}>
            {profile?.subscription_status === 'active' ? '● SUBSCRIBED' : `⏱ ${formatted}`}
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}
            className="font-mono text-xs opacity-30 hover:opacity-70 transition-opacity">
            EXIT
          </button>
        </div>
      </header>

      {/* Config bar */}
      <div className="flex flex-wrap gap-3 py-3 border-b border-[var(--glass-border)]">
        <select value={system} onChange={e => setSystem(e.target.value as CountSystem)}
          className="bg-transparent border border-[var(--glass-border)] rounded px-2 py-1 font-mono text-xs text-[var(--neon-cyan)] outline-none">
          {(Object.keys(SYSTEM_LABELS) as CountSystem[]).map(s => (
            <option key={s} value={s} style={{ background: '#030712' }}>{SYSTEM_LABELS[s]}</option>
          ))}
        </select>
        <select value={numDecks} onChange={e => setNumDecks(Number(e.target.value) as NumDecks)}
          className="bg-transparent border border-[var(--glass-border)] rounded px-2 py-1 font-mono text-xs text-[var(--neon-cyan)] outline-none">
          <option value={2} style={{ background: '#030712' }}>2 Decks</option>
          <option value={6} style={{ background: '#030712' }}>6 Decks</option>
          <option value={8} style={{ background: '#030712' }}>8 Decks</option>
        </select>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs opacity-30">MIN</span>
          <input type="number" value={minBet} onChange={e => setMinBet(Number(e.target.value))}
            className="w-16 bg-transparent border border-[var(--glass-border)] rounded px-2 py-1 font-mono text-xs text-[var(--neon-cyan)] outline-none" />
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs opacity-30">MAX</span>
          <input type="number" value={maxBet} onChange={e => setMaxBet(Number(e.target.value))}
            className="w-20 bg-transparent border border-[var(--glass-border)] rounded px-2 py-1 font-mono text-xs text-[var(--neon-cyan)] outline-none" />
        </div>
        <button onClick={() => setShowWalkthrough(true)} className="font-mono text-xs opacity-30 hover:opacity-70">HELP</button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 py-4">

        {/* LEFT: Count panel */}
        <div className="space-y-4">

          {/* Running count */}
          <div className="glass p-5">
            <div className="font-mono text-xs opacity-40 tracking-widest uppercase mb-3">Running Count</div>
            <div className="flex items-end gap-4">
              <div className={`font-orbitron font-black text-6xl neon-text ${gameState ? 'animate-count' : ''}`}>
                {gameState?.runningCount ?? 0}
              </div>
              <div className="pb-2">
                <div className="font-mono text-xs opacity-40">TRUE COUNT</div>
                <div className="font-orbitron font-bold text-2xl" style={{
                  color: (gameState?.trueCount ?? 0) >= 3 ? 'var(--neon-green)' :
                         (gameState?.trueCount ?? 0) <= -2 ? 'var(--neon-magenta)' : 'var(--neon-cyan)'
                }}>
                  {(gameState?.trueCount ?? 0).toFixed(1)}
                </div>
              </div>
            </div>

            {gameState && (
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--glass-border)] pt-3">
                <div>
                  <div className="font-mono text-xs opacity-30">CARDS SEEN</div>
                  <div className="font-mono text-sm">{gameState.cardsDealt}</div>
                </div>
                <div>
                  <div className="font-mono text-xs opacity-30">DECKS LEFT</div>
                  <div className="font-mono text-sm">{gameState.decksRemaining?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="font-mono text-xs opacity-30">PENETRATION</div>
                  <div className="font-mono text-sm">{((gameState.penetration ?? 0) * 100).toFixed(0)}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Bet recommendation */}
          {gameState?.bet && (
            <div className="glass p-4">
              <div className="font-mono text-xs opacity-40 tracking-widest uppercase mb-3">Bet Intelligence</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs opacity-30">RECOMMENDED BET</div>
                  <div className="font-orbitron font-bold text-3xl neon-text">${gameState.bet.recommendedBet}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs opacity-30">SIGNAL</div>
                  <div className="font-orbitron text-sm font-bold" style={{ color: `var(--neon-${gameState.bet.signalColor})` }}>
                    {gameState.bet.signal}
                  </div>
                  <div className="font-mono text-xs opacity-40">EDGE: {gameState.bet.edge}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Card input grid */}
          <div className="glass p-4">
            <div className="font-mono text-xs opacity-40 tracking-widest uppercase mb-3">Log Cards</div>
            <div className="grid grid-cols-7 gap-1.5">
              {CARD_OPTIONS.map(card => (
                <button
                  key={card}
                  onClick={() => addCard(card)}
                  className="glass font-orbitron font-bold text-sm py-2.5 hover:glass-hot transition-all"
                  style={{ color: ['J','Q','K'].includes(card) ? 'var(--neon-magenta)' : card === 'A' ? 'var(--neon-amber)' : 'var(--neon-cyan)' }}
                >
                  {card}
                </button>
              ))}
            </div>

            {/* Recent cards */}
            {recentCards.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {recentCards.slice(0, 10).map((c, i) => (
                  <span key={i} className="font-mono text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,238,255,0.05)', border: '1px solid var(--glass-border)', opacity: 1 - i * 0.08 }}>
                    {c}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button onClick={resetShoe} className="btn-neon btn-danger text-xs flex-1">RESET SHOE</button>
            </div>
          </div>

          {/* Voice + Scan controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleVoice}
              className={`glass p-4 text-center transition-all ${voiceActive ? 'glass-hot' : ''}`}
            >
              <div className="text-2xl mb-1">{voiceActive ? '🎤' : '🎙'}</div>
              <div className="font-orbitron text-xs font-bold" style={{ color: voiceActive ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
                {voiceActive ? 'VOICE ON' : 'VOICE'}
              </div>
              {voiceActive && voiceTranscript && (
                <div className="font-mono text-xs opacity-50 mt-1 truncate">{voiceTranscript}</div>
              )}
            </button>

            <button
              onClick={toggleScan}
              className={`glass p-4 text-center transition-all ${scanActive ? 'glass-hot' : ''}`}
            >
              <div className="text-2xl mb-1">{scanActive ? '📡' : '📷'}</div>
              <div className="font-orbitron text-xs font-bold" style={{ color: scanActive ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
                {scanActive ? 'SCAN ON' : 'SCAN'}
              </div>
            </button>
          </div>

          {/* Camera preview */}
          {scanActive && (
            <div className="glass p-2 relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-3 left-3 font-mono text-xs neon-green animate-pulse-glow">● SCANNING</div>
            </div>
          )}
        </div>

        {/* RIGHT: Prediction panel */}
        <div className="space-y-4">

          {/* Prediction input */}
          <div className="glass p-5">
            <div className="font-mono text-xs opacity-40 tracking-widest uppercase mb-4">Hand Analysis</div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="font-mono text-xs opacity-30 block mb-1">YOUR TOTAL</label>
                <input
                  type="number" min={4} max={21}
                  value={playerTotal}
                  onChange={e => setPlayerTotal(e.target.value)}
                  className="w-full bg-transparent border border-[var(--glass-border)] rounded px-3 py-2 font-orbitron font-bold text-xl text-[var(--neon-cyan)] outline-none focus:border-[var(--neon-cyan)]"
                  placeholder="17"
                />
              </div>
              <div>
                <label className="font-mono text-xs opacity-30 block mb-1">DEALER UPCARD</label>
                <select
                  value={dealerUpcard}
                  onChange={e => setDealerUpcard(e.target.value)}
                  className="w-full bg-transparent border border-[var(--glass-border)] rounded px-3 py-2 font-orbitron font-bold text-xl text-[var(--neon-magenta)] outline-none focus:border-[var(--neon-magenta)]"
                >
                  <option value="" style={{ background: '#030712' }}>—</option>
                  {CARD_OPTIONS.map(c => <option key={c} value={c} style={{ background: '#030712' }}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 font-mono text-xs opacity-50 cursor-pointer">
                <input type="checkbox" checked={isSoft} onChange={e => setIsSoft(e.target.checked)}
                  className="accent-[var(--neon-cyan)]" />
                SOFT HAND
              </label>
              <label className="flex items-center gap-2 font-mono text-xs opacity-50 cursor-pointer">
                <input type="checkbox" checked={isPair} onChange={e => setIsPair(e.target.checked)}
                  className="accent-[var(--neon-magenta)]" />
                PAIR
              </label>
            </div>

            <button onClick={getPrediction} disabled={loading || !playerTotal || !dealerUpcard}
              className="btn-neon btn-neon-solid w-full">
              {loading ? 'COMPUTING...' : 'ANALYZE HAND'}
            </button>
          </div>

          {/* Prediction result */}
          {prediction && (
            <div className="glass p-5 animate-boot">
              <div className="font-mono text-xs opacity-40 tracking-widest uppercase mb-4">CIS Recommendation</div>

              <div className="flex justify-center mb-5">
                <div className={`action-badge action-${prediction.actionLabel}`}>
                  {prediction.actionLabel}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="glass p-2">
                  <div className="font-mono text-xs opacity-30">CONFIDENCE</div>
                  <div className="font-orbitron font-bold text-lg neon-text">
                    {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="glass p-2">
                  <div className="font-mono text-xs opacity-30">TRUE COUNT</div>
                  <div className="font-orbitron font-bold text-lg" style={{
                    color: prediction.trueCount >= 3 ? 'var(--neon-green)' :
                           prediction.trueCount <= -2 ? 'var(--neon-magenta)' : 'var(--neon-cyan)'
                  }}>
                    {prediction.trueCount.toFixed(1)}
                  </div>
                </div>
              </div>

              {prediction.insurance && (
                <div className="p-2 mb-3 rounded text-center font-mono text-xs"
                  style={{ background: 'rgba(255,183,0,0.1)', border: '1px solid var(--neon-amber)', color: 'var(--neon-amber)' }}>
                  ⚡ TAKE INSURANCE — True count warrants it
                </div>
              )}

              {prediction.deviation && (
                <div className="p-2 rounded font-mono text-xs"
                  style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid var(--neon-green)', color: 'var(--neon-green)' }}>
                  ⚡ COUNT DEVIATION: {prediction.deviation.play} → {prediction.deviation.action}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="text-center">
                  <div className="font-mono text-xs opacity-30">EV STAND</div>
                  <div className="font-mono text-sm" style={{ color: prediction.ev.stand >= 0 ? 'var(--neon-green)' : 'var(--neon-magenta)' }}>
                    {prediction.ev.stand >= 0 ? '+' : ''}{prediction.ev.stand}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-xs opacity-30">EV HIT</div>
                  <div className="font-mono text-sm" style={{ color: prediction.ev.hit >= 0 ? 'var(--neon-green)' : 'var(--neon-magenta)' }}>
                    {prediction.ev.hit >= 0 ? '+' : ''}{prediction.ev.hit}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {(notification || toast) && (
        <div className={`toast ${toast?.type === 'error' ? 'toast-error' : toast?.type === 'warning' ? 'toast-warning' : 'toast-info'}`}>
          {notification || toast?.message}
        </div>
      )}

      {/* Paywall overlay */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(3,7,18,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="glass w-full max-w-sm p-8 text-center">
            <div className="font-orbitron font-black text-3xl neon-text mb-2">SESSION EXPIRED</div>
            <div className="font-mono text-xs opacity-40 mb-6">Your 1-hour trial has ended</div>
            <div className="font-orbitron font-black text-5xl neon-text mb-1">$9.99</div>
            <div className="font-mono text-xs opacity-40 mb-6">per month · cancel anytime</div>
            <button className="btn-neon btn-neon-solid w-full mb-3">SUBSCRIBE NOW</button>
            <div className="font-mono text-xs opacity-30">Apple Pay · Google Pay · Credit Card</div>
          </div>
        </div>
      )}

      {/* Walkthrough overlay */}
      {showWalkthrough && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(3,7,18,0.9)', backdropFilter: 'blur(12px)' }}>
          <div className="glass w-full max-w-sm p-8">
            <div className="font-mono text-xs opacity-30 mb-1">{walkthroughStep + 1} / {WALKTHROUGH.length}</div>
            <div className="font-orbitron font-bold text-lg neon-text mb-3">{WALKTHROUGH[walkthroughStep].title}</div>
            <div className="font-mono text-sm opacity-60 mb-8 leading-relaxed">{WALKTHROUGH[walkthroughStep].body}</div>
            <div className="flex gap-3">
              {walkthroughStep < WALKTHROUGH.length - 1 ? (
                <>
                  <button onClick={() => { setShowWalkthrough(false); localStorage.setItem('neon21_walkthrough_done', '1'); }}
                    className="btn-neon flex-1 text-xs opacity-40">SKIP</button>
                  <button onClick={() => setWalkthroughStep(s => s + 1)} className="btn-neon btn-neon-solid flex-1">NEXT →</button>
                </>
              ) : (
                <button onClick={() => { setShowWalkthrough(false); localStorage.setItem('neon21_walkthrough_done', '1'); }}
                  className="btn-neon btn-neon-solid w-full">ENTER SYSTEM</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
