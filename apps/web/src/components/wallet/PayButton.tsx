'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PAYMENT_RECEIVER, PLAN_PRICES_NATIVE } from '@/lib/wagmi-config';

interface Props {
  planId: string;
  chainId: number;
  priceUsd: number;
  credits: number;
  onSuccess?: (txHash: string) => void;
}

export function PayButton({ planId, chainId, priceUsd, credits, onSuccess }: Props) {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [credited, setCredited] = useState(false);

  const amountStr = PLAN_PRICES_NATIVE[planId]?.[chainId] || '0.01';

  async function handlePay() {
    if (!isConnected || !address) return;
    if (chain?.id !== chainId) {
      switchChain?.({ chainId });
      return;
    }
    if (PAYMENT_RECEIVER === '0x0000000000000000000000000000000000000000') {
      alert('Укажи NEXT_PUBLIC_TREASURY_ADDRESS в .env');
      return;
    }
    sendTransaction({ to: PAYMENT_RECEIVER, value: parseEther(amountStr), chainId });
  }

  if (isSuccess && hash && !credited) {
    setCredited(true);
    fetch('/api/billing/credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, txHash: hash, chainId, amount: amountStr, token: 'native', userId: address }),
    }).then(() => onSuccess?.(hash));
  }

  if (!isConnected) {
    return (
      <div className="flex justify-center">
        <ConnectButton label="Подключить MetaMask" showBalance={false} />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <p className="text-green-400 font-medium mb-1">✓ Оплачено</p>
        <p className="text-xs text-zinc-500 break-all">Tx: {hash}</p>
        <p className="text-sm text-zinc-400 mt-2">+{credits} кредитов</p>
      </div>
    );
  }

  return (
    <div>
      {chain?.id !== chainId && (
        <p className="text-xs text-yellow-500 mb-2 text-center">Переключи сеть в кошельке</p>
      )}
      <button onClick={handlePay} disabled={isPending || isConfirming}
        className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 font-medium transition">
        {isPending && 'Подтверди в MetaMask...'}
        {isConfirming && 'Ждём подтверждения...'}
        {!isPending && !isConfirming && `Оплатить $${priceUsd} (${amountStr} native)`}
      </button>
      {error && <p className="text-red-400 text-xs mt-2 text-center">{error.message}</p>}
    </div>
  );
}
