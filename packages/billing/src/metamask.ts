/**
 * OmniDev Billing via MetaMask
 * Accept payments in any EVM network.
 */

export type SupportedChainId = 1 | 10 | 137 | 42161 | 8453 | 56 | 43114 | 11155111;

export interface PaymentPlan {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  amount: bigint;
  token: 'native' | 'usdc' | 'usdt';
}

export interface ChainConfig {
  chainId: SupportedChainId;
  name: string;
  nativeSymbol: string;
  usdcAddress?: `0x${string}`;
  receiver: `0x${string}`;
}

export const TREASURY: `0x${string}` = '0x0000000000000000000000000000000000000000';

export const CHAINS: Record<SupportedChainId, ChainConfig> = {
  1: { chainId: 1, name: 'Ethereum', nativeSymbol: 'ETH', usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', receiver: TREASURY },
  10: { chainId: 10, name: 'Optimism', nativeSymbol: 'ETH', usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', receiver: TREASURY },
  137: { chainId: 137, name: 'Polygon', nativeSymbol: 'MATIC', usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', receiver: TREASURY },
  42161: { chainId: 42161, name: 'Arbitrum', nativeSymbol: 'ETH', usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', receiver: TREASURY },
  8453: { chainId: 8453, name: 'Base', nativeSymbol: 'ETH', usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', receiver: TREASURY },
  56: { chainId: 56, name: 'BNB Chain', nativeSymbol: 'BNB', usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', receiver: TREASURY },
  43114: { chainId: 43114, name: 'Avalanche', nativeSymbol: 'AVAX', usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', receiver: TREASURY },
  11155111: { chainId: 11155111, name: 'Sepolia', nativeSymbol: 'ETH', receiver: TREASURY },
};

export const PLANS: PaymentPlan[] = [
  { id: 'starter', name: 'Starter', credits: 100, priceUsd: 9, amount: BigInt(0), token: 'usdc' },
  { id: 'pro', name: 'Pro', credits: 500, priceUsd: 39, amount: BigInt(0), token: 'usdc' },
  { id: 'team', name: 'Team', credits: 2000, priceUsd: 129, amount: BigInt(0), token: 'usdc' },
];

export function buildPaymentRequest(opts: {
  planId: string;
  chainId: SupportedChainId;
  amount: bigint;
  token: 'native' | 'usdc';
}) {
  const chain = CHAINS[opts.chainId];
  if (!chain) throw new Error(`Unsupported chain ${opts.chainId}`);

  if (opts.token === 'native') {
    return { type: 'native' as const, to: chain.receiver, value: opts.amount, chainId: opts.chainId };
  }

  if (!chain.usdcAddress) throw new Error(`USDC not configured for chain ${opts.chainId}`);

  return {
    type: 'erc20' as const,
    address: chain.usdcAddress,
    abi: [{ name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const,
    functionName: 'transfer' as const,
    args: [chain.receiver, opts.amount] as const,
    chainId: opts.chainId,
  };
}
