import type { NextConfig } from 'next';

const isDocker = process.env.DOCKER_BUILD === '1';

const nextConfig: NextConfig = {
  // standalone only for Docker; Vercel uses its own output
  ...(isDocker ? { output: 'standalone' as const } : {}),
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
