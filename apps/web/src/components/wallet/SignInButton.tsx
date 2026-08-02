'use client';

import { useState } from 'react';
import { connectWallet, personalSign, getEthereum } from '@/lib/ethereum';
import { getLocalCredits, setLocalCredits } from '@/lib/credits';

interface Props {
  onAuth?: (user: { id: string; walletAddress: string; credits: number }) => void;
}

export function SignInButton({ onAuth }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ credits: number; walletAddress: string } | null>(null);

  async function handleSiwe() {
    setStatus('loading');
    setError('');
    try {
      if (!getEthereum()) throw new Error('Установи MetaMask');
      const address = await connectWallet();
      const nonceRes = await fetch(`/api/siwe/nonce?address=${address}`);
      const { message, error: nErr } = await nonceRes.json();
      if (nErr || !message) throw new Error(nErr || 'Failed to get nonce');
      const signature = await personalSign(message, address);
      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok || !data.success) throw new Error(data.error || 'Verify failed');
      if (typeof data.user.credits === 'number') setLocalCredits(data.user.credits);
      setUser(data.user);
      setStatus('done');
      onAuth?.(data.user);
      localStorage.setItem('omnidev_session', JSON.stringify(data.user));
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
      setStatus('error');
    }
  }

  if (user || status === 'done') {
    return (
      <div className="text-xs text-zinc-400">
        <span className="text-violet-400">{user?.walletAddress?.slice(0, 6)}…</span>
        <span className="ml-2">{user?.credits ?? getLocalCredits()} cr</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleSiwe} disabled={status === 'loading'}
        className="text-xs px-2.5 py-1 rounded-lg bg-violet-600/80 hover:bg-violet-500 disabled:opacity-50">
        {status === 'loading' ? 'Подпись...' : 'Sign-In'}
      </button>
      {error && <span className="text-[10px] text-red-400 max-w-[100px] truncate">{error}</span>}
    </div>
  );
}
