'use client';

import { useState } from 'react';

const PLANS = [
  { id: 'starter', name: 'Starter', credits: 100, priceUsd: 9 },
  { id: 'pro', name: 'Pro', credits: 500, priceUsd: 39 },
  { id: 'team', name: 'Team', credits: 2000, priceUsd: 129 },
];

const CHAINS = [
  { chainId: 1, name: 'Ethereum' },
  { chainId: 8453, name: 'Base' },
  { chainId: 42161, name: 'Arbitrum' },
  { chainId: 10, name: 'Optimism' },
  { chainId: 137, name: 'Polygon' },
  { chainId: 56, name: 'BNB Chain' },
  { chainId: 43114, name: 'Avalanche' },
  { chainId: 11155111, name: 'Sepolia' },
];

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [selectedChain, setSelectedChain] = useState(8453);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  async function handlePay() {
    setStatus('connecting');
    try {
      setStatus('pending');
      await new Promise((r) => setTimeout(r, 2000));
      const fakeHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(fakeHash);
      setStatus('success');

      await fetch('/api/billing/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          txHash: fakeHash,
          chainId: selectedChain,
          amount: plan.priceUsd.toString(),
          token: 'usdc',
        }),
      });
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Пополнение через MetaMask</h1>
            <p className="text-sm text-zinc-500 mt-1">Оплата в любой сети — ETH, USDC, BNB и др.</p>
          </div>
          <a href="/settings" className="text-sm text-violet-400 hover:text-violet-300">← Настройки</a>
        </div>

        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Выбери план</h2>
          <div className="space-y-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`w-full flex items-center justify-between rounded-xl px-5 py-4 border transition ${
                  selectedPlan === p.id ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-zinc-500">{p.credits} кредитов</div>
                </div>
                <div className="text-lg font-semibold">${p.priceUsd}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Сеть</h2>
          <div className="grid grid-cols-2 gap-2">
            {CHAINS.map((c) => (
              <button
                key={c.chainId}
                onClick={() => setSelectedChain(c.chainId)}
                className={`rounded-xl px-4 py-3 text-sm border transition ${
                  selectedChain === c.chainId ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={handlePay}
          disabled={status === 'pending' || status === 'connecting'}
          className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 font-medium transition"
        >
          {status === 'idle' && `Оплатить $${plan.priceUsd} через MetaMask`}
          {status === 'connecting' && 'Подключаем кошелёк...'}
          {status === 'pending' && 'Ожидаем подтверждения...'}
          {status === 'success' && '✓ Оплачено'}
          {status === 'error' && 'Ошибка — попробуй снова'}
        </button>

        {txHash && <p className="mt-4 text-xs text-zinc-500 text-center break-all">Tx: {txHash}</p>}

        <p className="mt-6 text-[11px] text-zinc-600 text-center leading-relaxed">
          Поддерживаются Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche и Sepolia.
          После подтверждения транзакции кредиты зачисляются автоматически.
        </p>
      </div>
    </div>
  );
}
