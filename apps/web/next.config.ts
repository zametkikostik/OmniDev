import type { NextConfig } from 'next';
import path from 'path';

const isDocker = process.env.DOCKER_BUILD === '1';
const stub = (name: string) => path.join(process.cwd(), 'vendor', name, 'index.js');
const stubClient = (name: string) => path.join(process.cwd(), 'vendor', name, 'client.js');

const nextConfig: NextConfig = {
  ...(isDocker ? { output: 'standalone' as const } : {}),
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@x402/evm': stub('x402-evm'),
      '@x402/evm/upto/client': stubClient('x402-evm'),
      '@x402/evm/exact/client': stubClient('x402-evm'),
      '@x402/core': stub('x402-core'),
      '@x402/core/client': stubClient('x402-core'),
      '@x402/svm': stub('x402-svm'),
      '@x402/svm/exact/client': stubClient('x402-svm'),
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
