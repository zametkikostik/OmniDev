import type { NextConfig } from 'next';

const isDocker = process.env.DOCKER_BUILD === '1';

const devOrigins = (process.env.ALLOWED_DEV_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(isDocker ? { output: 'standalone' as const } : {}),
  allowedDevOrigins: devOrigins.length ? devOrigins : ['localhost', '127.0.0.1'],
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
