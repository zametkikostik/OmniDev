'use client';

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getLocalCredits, setLocalCredits } from '@/lib/credits';

interface Props {
  onAuth?: (user: { id: string; walletAddress: string; credits: number }) => void;
}

export function SignInButton({ onAuth }: Props) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ credits: number; walletAddress: string } | null>(null);

  async function handleSiwe() {
    if (!address) return;
    setStatus('loading');
    setError('');
    try {
      const nonceRes = await fetch(`/api/siwe/nonce?address=${address}`);
      const { message, error: nErr } = await nonceRes.json();
      if (nErr || !message) throw new Error(nErr || 'Failed to get nonce');
      const signature = await signMessageAsync({ message });
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

  if (!isConnected) {
    return <ConnectButton label="Кошелёк" showBalance={false} chainStatus="none" accountStatus="avatar" />;
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
      {error && <span className="text-[10px] text-red-400 max-w-[80px] truncate">{error}</span>}
    </div>
  );
}
