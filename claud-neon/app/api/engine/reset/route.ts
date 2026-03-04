import { NextRequest, NextResponse } from 'next/server';
const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id') || '';
  const res = await fetch(`${ENGINE_URL}/api/reset`, {
    method: 'POST',
    headers: { 'x-session-id': sessionId }
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
