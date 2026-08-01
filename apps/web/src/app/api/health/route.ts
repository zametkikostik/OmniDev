import { NextResponse } from 'next/server';
import { hasDatabase } from '../../../../../../packages/db/src/client';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'omnidev',
    version: '0.8.0',
    database: hasDatabase() ? 'postgres' : 'memory',
    timestamp: new Date().toISOString(),
  });
}
