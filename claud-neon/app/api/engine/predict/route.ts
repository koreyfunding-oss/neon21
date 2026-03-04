// app/api/engine/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';
const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id') || '';
  const body = await req.json();
  const res = await fetch(`${ENGINE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
    body: JSON.stringify(body)
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
