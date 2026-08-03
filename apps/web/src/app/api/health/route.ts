import { NextResponse } from 'next/server';
import { hasDatabase, ensureDb } from '@/lib/db';

export async function GET() {
  let neon = false;
  try {
    neon = await ensureDb();
  } catch {}
  return NextResponse.json({
    ok: true,
    service: 'omnidev',
    neon: neon || hasDatabase(),
    ollama: process.env.ALLOW_OLLAMA === '1' || process.env.ALLOW_OLLAMA === 'true',
    provider: process.env.PLATFORM_LLM_PROVIDER || process.env.DEFAULT_LLM_PROVIDER || 'openrouter',
    time: new Date().toISOString(),
  });
}
