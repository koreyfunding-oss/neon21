// app/api/engine/predict/route.ts
// Serverless-compatible: directly calls engine (no Express proxy)
import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/state/stateManager';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProbabilityEngine } = require('@/engine/probability');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TrueCountEngine } = require('@/engine/trueCount');

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id') || '';
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { playerTotal, dealerUpcard, isSoft, isPair, pairCard } = body;

    if (playerTotal == null || dealerUpcard == null) {
      return NextResponse.json({ error: 'playerTotal and dealerUpcard required' }, { status: 400 });
    }

    const session = stateManager.getOrCreate(sessionId);
    const countState = session.counting.getState();
    const trueCount = TrueCountEngine.calculate(
      countState.runningCount, countState.cardsDealt, countState.numDecks
    );

    const strategy = ProbabilityEngine.getBasicStrategy(
      playerTotal, dealerUpcard, isSoft, isPair, pairCard
    );
    const ev = ProbabilityEngine.expectedValue(playerTotal, dealerUpcard, trueCount, isSoft);
    const deviations = TrueCountEngine.getDeviations(trueCount);
    const applicableDeviation = deviations.find((d: { play: string }) => {
      return d.play.includes(String(playerTotal)) && d.play.includes(String(dealerUpcard));
    });

    const finalAction = applicableDeviation
      ? applicableDeviation.action.split(' ')[0].charAt(0).toUpperCase()
      : strategy.action;

    return NextResponse.json({
      playerTotal,
      dealerUpcard,
      trueCount: parseFloat(trueCount.toFixed(2)),
      action: finalAction,
      actionLabel: ProbabilityEngine.actionLabel(finalAction),
      actionColor: ProbabilityEngine.actionColor(finalAction),
      basicStrategy: strategy,
      deviation: applicableDeviation || null,
      ev,
      insurance: TrueCountEngine.shouldTakeInsurance(trueCount),
      confidence: Math.min(0.7 + Math.abs(trueCount) * 0.05, 0.99)
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
