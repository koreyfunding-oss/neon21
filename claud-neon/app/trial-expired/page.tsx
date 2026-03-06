'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TrialExpiredPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);

 async function handleSubscribe(plan: 'basic' | 'premium') {
 setLoading(true);
 try {
 const { data: { session } } = await supabase.auth.getSession();
 if (!session) {
 router.push('/auth');
 return;
 }
 const response = await fetch('/api/subscribe', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ userId: session.user.id, plan })
 });
 if (response.ok) {
 router.push('/dashboard');
 }
 } catch (err) {
 console.error('Subscription error:', err);
 } finally {
 setLoading(false);
 }
 }

 async function handleSignOut() {
 await supabase.auth.signOut();
 router.push('/auth');
 }

 return (
 <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-void">
 <div className="mb-12 text-center">
 <div className="font-orbitron text-5xl font-black neon-text tracking-widest mb-4">⏰ TRIAL EXPIRED</div>
 <div className="font-mono text-sm opacity-60">Your 1-hour free trial has ended</div>
 </div>
 <div className="glass w-full max-w-2xl p-12 mb-8">
 <p className="text-center text-neon-cyan mb-8">To continue using NEON21, please select a subscription plan:</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
 <div className="border-2 border-neon-amber p-6 rounded-lg">
 <h3 className="font-orbitron text-xl neon-amber mb-2">BASIC</h3>
 <div className="font-orbitron text-3xl mb-4">$9.99<span className="text-sm opacity-70">/month</span></div>
 <ul className="text-sm space-y-2 mb-6 opacity-80">
 <li>✓ Full card counting access</li>
 <li>✓ Running count tracking</li>
 <li>✓ Basic analytics</li>
 </ul>
 <button onClick={() => handleSubscribe('basic')} disabled={loading} className="w-full bg-neon-amber text-void font-bold py-2 rounded hover:opacity-80 transition">
 {loading ? 'Processing...' : 'Subscribe Now'}
 </button>
 </div>
 <div className="border-2 border-neon-magenta p-6 rounded-lg">
 <h3 className="font-orbitron text-xl neon-magenta mb-2">PREMIUM</h3>
 <div className="font-orbitron text-3xl mb-4">$19.99<span className="text-sm opacity-70">/month</span></div>
 <ul className="text-sm space-y-2 mb-6 opacity-80">
 <li>✓ Everything in BASIC</li>
 <li>✓ Voice command support</li>
 <li>✓ Advanced analytics</li>
 <li>✓ Priority support</li>
 </ul>
 <button onClick={() => handleSubscribe('premium')} disabled={loading} className="w-full bg-neon-magenta text-void font-bold py-2 rounded hover:opacity-80 transition">
 {loading ? 'Processing...' : 'Subscribe Now'}
 </button>
 </div>
 </div>
 </div>
 <button onClick={handleSignOut} className="text-neon-cyan hover:text-neon-amber transition">
 Sign Out
 </button>
 </div>
 );
}