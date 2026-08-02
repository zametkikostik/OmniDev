import type { NextConfig } from 'next';
import path from 'path';

const isDocker = process.env.DOCKER_BUILD === '1';

/** Stub path for optional @x402/* (pulled by wagmi → Coinbase Base Account). */
const x402Stub = path.join(process.cwd(), 'src/stubs/empty.js');

const nextConfig: NextConfig = {
  ...(isDocker ? { output: 'standalone' as const } : {}),
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@x402/evm': x402Stub,
      '@x402/evm/upto/client': x402Stub,
      '@x402/evm/exact/client': x402Stub,
      '@x402/core': x402Stub,
      '@x402/core/client': x402Stub,
      '@x402/svm': x402Stub,
      '@x402/svm/exact/client': x402Stub,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
