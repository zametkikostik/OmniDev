'use client';

import { useEffect, useState } from 'react';
import { CREDIT_COSTS } from '@/lib/credits';

export function UsagePanel({ address }: { address?: string | null }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [costs, setCosts] = useState(CREDIT_COSTS);

  useEffect(() => {
    const q = address ? `?address=${encodeURIComponent(address)}` : '';
    fetch(`/api/usage${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.credits === 'number') setCredits(d.credits);
        if (d.costs) setCosts(d.costs);
      })
      .catch(() => {});
  }, [address]);

  return (
    <section className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <h2 className="font-medium mb-3">Usage / тарифы</h2>
      {credits !== null && (
        <p className="text-2xl font-semibold text-violet-300 tabular-nums mb-3">
          {credits} <span className="text-sm text-zinc-500">server</span>
        </p>
      )}
      <ul className="text-xs text-zinc-400 space-y-1 font-mono">
        {Object.entries(costs).map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span>{k}</span>
            <span className="text-violet-300">{v} cr</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-zinc-600 mt-3">
        Списание на сервере — только после успешной генерации.
      </p>
    </section>
  );
}
