// app/api/engine/reset/route.ts
// Serverless-compatible: directly calls engine (no Express proxy)
import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/state/stateManager';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id') || '';
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const result = stateManager.resetShoe(sessionId);
    const state = stateManager.getFullState(sessionId);
    return NextResponse.json({ ...result, state });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Session not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id') || '';
    stateManager.deleteSession(sessionId);
    return NextResponse.json({ success: true, message: 'Session terminated' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
