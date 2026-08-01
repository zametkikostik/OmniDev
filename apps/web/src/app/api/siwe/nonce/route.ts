import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const nonces = new Map<string, { nonce: string; exp: number }>();

export function consumeNonce(address: string, nonce: string): boolean {
  const key = address.toLowerCase();
  const entry = nonces.get(key);
  if (!entry) return false;
  if (Date.now() > entry.exp) { nonces.delete(key); return false; }
  if (entry.nonce !== nonce) return false;
  nonces.delete(key);
  return true;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Valid address required' }, { status: 400 });
  }
  const nonce = randomBytes(16).toString('hex');
  nonces.set(address.toLowerCase(), { nonce, exp: Date.now() + 10 * 60 * 1000 });
  const domain = req.headers.get('host') || 'omnidev.app';
  const uri = `${req.nextUrl.protocol}//${domain}`;
  const issuedAt = new Date().toISOString();
  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address, '', 'Sign in to OmniDev', '',
    `URI: ${uri}`, 'Version: 1', 'Chain ID: 1',
    `Nonce: ${nonce}`, `Issued At: ${issuedAt}`,
  ].join('\n');
  return NextResponse.json({ nonce, message });
}
