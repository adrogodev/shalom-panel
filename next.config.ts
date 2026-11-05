import type { NextConfig } from 'next';

const isStandalone = process.env.NEXT_STANDALONE === 'true' || process.platform !== 'win32';

const nextConfig: NextConfig = {
  output: isStandalone ? 'standalone' : undefined,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
