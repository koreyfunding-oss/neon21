// app/api/engine/count/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id') || '';
  const body = await req.json();
  const res = await fetch(`${ENGINE_URL}/api/count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id') || '';
  const res = await fetch(`${ENGINE_URL}/api/count/last`, {
    method: 'DELETE',
    headers: { 'x-session-id': sessionId }
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
