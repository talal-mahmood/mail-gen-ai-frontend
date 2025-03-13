import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxies requests to `/v1/chat/splash-generate` to your HTTP backend
        source: '/v1/:path*',
        destination: 'http://service.byteb.io:8080/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
