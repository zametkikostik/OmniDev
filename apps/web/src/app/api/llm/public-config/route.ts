import { NextResponse } from 'next/server';
import { getPublicLlmInfo } from '@/lib/build-llm-config';

/** Safe for all clients — no keys, no Ollama host/models. */
export async function GET() {
  return NextResponse.json(getPublicLlmInfo());
}
