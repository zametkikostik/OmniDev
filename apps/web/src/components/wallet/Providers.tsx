'use client';

import { ReactNode } from 'react';

/** Pass-through — no RainbowKit/wagmi (Coinbase @x402 breaks Vercel). */
export function Web3Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
