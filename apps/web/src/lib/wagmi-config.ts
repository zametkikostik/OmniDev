'use client';

import { http, createConfig } from 'wagmi';
import { mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo_omnidev_project_id';

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, sepolia],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({ projectId: wcProjectId, showQrModal: true }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

export const PAYMENT_RECEIVER =
  (process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`) ||
  '0x0000000000000000000000000000000000000000';

export const PLAN_PRICES_NATIVE: Record<string, Record<number, string>> = {
  starter: { 1: '0.003', 8453: '0.003', 42161: '0.003', 10: '0.003', 137: '12', 56: '0.02', 43114: '0.25', 11155111: '0.01' },
  pro: { 1: '0.013', 8453: '0.013', 42161: '0.013', 10: '0.013', 137: '50', 56: '0.08', 43114: '1', 11155111: '0.05' },
  team: { 1: '0.04', 8453: '0.04', 42161: '0.04', 10: '0.04', 137: '160', 56: '0.25', 43114: '3.5', 11155111: '0.1' },
};
