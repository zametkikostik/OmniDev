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
    [mainnet.id]: http(), [base.id]: http(), [arbitrum.id]: http(), [optimism.id]: http(),
    [polygon.id]: http(), [bsc.id]: http(), [avalanche.id]: http(), [sepolia.id]: http(),
  },
  ssr: true,
});

export const PAYMENT_RECEIVER =
  (process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`) ||
  '0x0000000000000000000000000000000000000000';

export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
};

export const PLAN_PRICES_USDC: Record<string, bigint> = {
  starter: BigInt(9_000_000),
  pro: BigInt(39_000_000),
  team: BigInt(129_000_000),
};

export const PLAN_PRICES_NATIVE: Record<string, Record<number, string>> = {
  starter: { 1: '0.003', 8453: '0.003', 42161: '0.003', 10: '0.003', 137: '12', 56: '0.02', 43114: '0.25', 11155111: '0.01' },
  pro: { 1: '0.013', 8453: '0.013', 42161: '0.013', 10: '0.013', 137: '50', 56: '0.08', 43114: '1', 11155111: '0.05' },
  team: { 1: '0.04', 8453: '0.04', 42161: '0.04', 10: '0.04', 137: '160', 56: '0.25', 43114: '3.5', 11155111: '0.1' },
};

export const ERC20_ABI = [
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;
