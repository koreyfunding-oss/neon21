// app/api/engine/count/route.ts
// Serverless-compatible: directly calls engine (no Express proxy)
import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/state/stateManager';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id') || '';
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { cards, card, numDecks, system, minBet, maxBet, bankroll } = body;

    stateManager.getOrCreate(sessionId, { numDecks, system, minBet, maxBet, bankroll });

    const cardsToAdd: string[] = cards || (card ? [card] : []);
    if (cardsToAdd.length === 0) {
      return NextResponse.json({ error: 'No cards provided' }, { status: 400 });
    }

    const results = [];
    for (const c of cardsToAdd) {
      const result = stateManager.addCard(sessionId, c);
      results.push(result);
    }

    const fullState = stateManager.getFullState(sessionId);
    return NextResponse.json({ success: true, cards: results, state: fullState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id') || '';
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = stateManager.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const removed = session.counting.removeLastCard();
    const fullState = stateManager.getFullState(sessionId);
    return NextResponse.json({ success: true, removed, state: fullState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
