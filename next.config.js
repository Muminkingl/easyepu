/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
    typescript: {
      // !! WARN !!
      // Dangerously allow production builds to successfully complete even if
      // your project has type errors.
      ignoreBuildErrors: true,
    },
    // Configure images
    images: {
      unoptimized: true, // This helps with direct image loading
      domains: ['i.imgur.com', 'imgur.com'],
    },
    // Output as a static site - this helps with images in the public folder
    output: 'standalone',
    // Increase the body size limit for server actions to 10MB
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb'
      }
    }
  };
  
  module.exports = nextConfig;