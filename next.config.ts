import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Remove console.log in production builds
    if (!dev) {
      config.optimization.minimizer.push(
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        })
      );
    }
    return config;
  },
  // Add additional security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // Explicitly control which environment variables are exposed to the client
  // This prevents accidental exposure of sensitive information
  env: {
    // Only expose public variables here
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },
};

export default nextConfig;
