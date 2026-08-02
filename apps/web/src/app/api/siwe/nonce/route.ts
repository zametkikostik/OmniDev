import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { setNonce } from '@/lib/siwe-nonce';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Valid address required' }, { status: 400 });
  }

  const nonce = randomBytes(16).toString('hex');
  setNonce(address, nonce);

  const domain = req.headers.get('host') || 'omnidev.app';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const uri = `${proto}://${domain}`;
  const issuedAt = new Date().toISOString();

  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to OmniDev',
    '',
    `URI: ${uri}`,
    'Version: 1',
    'Chain ID: 1',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');

  return NextResponse.json({ nonce, message });
}
