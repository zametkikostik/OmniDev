'use client';

import { useState } from 'react';
import { PayButton } from '@/components/wallet/PayButton';

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
  { chainId: 11155111, name: 'Sepolia (test)' },
];

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [selectedChain, setSelectedChain] = useState(8453);
  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Пополнение через MetaMask</h1>
            <p className="text-sm text-zinc-500 mt-1">Реальная оплата native-токеном</p>
          </div>
          <a href="/settings" className="text-sm text-violet-400 hover:text-violet-300">← Настройки</a>
        </div>

        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">План</h2>
          <div className="space-y-2">
            {PLANS.map((p) => (
              <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                className={`w-full flex items-center justify-between rounded-xl px-5 py-4 border transition ${
                  selectedPlan === p.id ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}>
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
              <button key={c.chainId} onClick={() => setSelectedChain(c.chainId)}
                className={`rounded-xl px-4 py-3 text-sm border transition ${
                  selectedChain === c.chainId ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}>{c.name}</button>
            ))}
          </div>
        </section>

        <PayButton planId={plan.id} chainId={selectedChain} priceUsd={plan.priceUsd} credits={plan.credits} />

        <p className="mt-6 text-[11px] text-zinc-600 text-center leading-relaxed">
          Укажи NEXT_PUBLIC_TREASURY_ADDRESS в .env. После подтверждения транзакции кредиты зачисляются.
        </p>
      </div>
    </div>
  );
}
