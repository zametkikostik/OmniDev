import { NextResponse } from 'next/server';
import { hasDatabase } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'omnidev',
    database: hasDatabase() ? 'postgres' : 'memory',
    time: new Date().toISOString(),
  });
}
