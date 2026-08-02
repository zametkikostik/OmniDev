'use client';

import { useState } from 'react';
import {
  PAYMENT_RECEIVER, PLAN_PRICES_NATIVE, PLAN_PRICES_USDC, USDC_ADDRESSES,
  parseEther, encodeErc20Transfer,
} from '@/lib/wagmi-config';
import {
  connectWallet, getChainId, switchChain, sendNative, sendContract, getEthereum,
} from '@/lib/ethereum';

interface Props {
  planId: string; chainId: number; priceUsd: number; credits: number;
  onSuccess?: (txHash: string) => void;
}

export function PayButton({ planId, chainId, priceUsd, credits, onSuccess }: Props) {
  const [payToken, setPayToken] = useState<'usdc' | 'native'>('usdc');
  const [address, setAddress] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [credited, setCredited] = useState(false);

  const usdcAddress = USDC_ADDRESSES[chainId];
  const canUsdc = Boolean(usdcAddress);
  const amountNative = PLAN_PRICES_NATIVE[planId]?.[chainId] || '0.01';
  const amountUsdc = PLAN_PRICES_USDC[planId] || BigInt(9_000_000);

  async function handleConnect() {
    try {
      setError('');
      setAddress(await connectWallet());
    } catch (e: any) {
      setError(e.message || 'Connect failed');
    }
  }

  async function handlePay() {
    setError('');
    setPending(true);
    try {
      if (!getEthereum()) throw new Error('Установи MetaMask');
      let addr = address;
      if (!addr) addr = await connectWallet();
      setAddress(addr);
      if ((await getChainId()) !== chainId) await switchChain(chainId);
      if (PAYMENT_RECEIVER === '0x0000000000000000000000000000000000000000') {
        throw new Error('Укажи NEXT_PUBLIC_TREASURY_ADDRESS в env');
      }
      let hash: string;
      if (payToken === 'usdc') {
        if (!usdcAddress) throw new Error('USDC недоступен');
        hash = await sendContract(usdcAddress, encodeErc20Transfer(PAYMENT_RECEIVER, amountUsdc));
      } else {
        hash = await sendNative(PAYMENT_RECEIVER, parseEther(amountNative));
      }
      setTxHash(hash);
      const res = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash, planId, chainId, address: addr, token: payToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verify failed');
      setCredited(true);
      onSuccess?.(hash);
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setPayToken('usdc')} disabled={!canUsdc}
          className={`flex-1 py-2 rounded-lg text-sm border ${payToken === 'usdc' ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-700 text-zinc-400'} disabled:opacity-40`}>USDC</button>
        <button type="button" onClick={() => setPayToken('native')}
          className={`flex-1 py-2 rounded-lg text-sm border ${payToken === 'native' ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-700 text-zinc-400'}`}>Native</button>
      </div>
      {!address ? (
        <button onClick={handleConnect} className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium">Подключить MetaMask</button>
      ) : (
        <button onClick={handlePay} disabled={pending || credited}
          className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-50">
          {credited ? '✓ Оплачено' : pending ? 'Транзакция...' : `Оплатить $${priceUsd} · ${credits} cr`}
        </button>
      )}
      {address && <p className="text-[11px] text-zinc-500 text-center font-mono">{address.slice(0, 6)}…{address.slice(-4)}</p>}
      {txHash && <p className="text-[11px] text-zinc-500 text-center break-all">tx: {txHash}</p>}
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
