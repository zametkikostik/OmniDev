import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { baseURL } = await req.json();
    const url = (baseURL || 'http://localhost:11434').replace(/\/$/, '');

    const res = await fetch(`${url}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return NextResponse.json({ models: [], error: 'Ollama unavailable' }, { status: 200 });
    }

    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name as string);

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [], error: 'Cannot reach Ollama' }, { status: 200 });
  }
}
