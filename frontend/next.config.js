/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  allowedDevOrigins: ['localhost', '192.168.100.45'],
  // Fix workspace root detection for monorepo
  outputFileTracingRoot: path.join(__dirname, '../'),
  // Completely disable ESLint during builds (Vercel deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Completely disable TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Disable source maps in production to reduce build time and bundle size
  productionBrowserSourceMaps: false,
  // Optimize output for serverless
  //commented for railway deployment
  //output: 'standalone',
}

module.exports = nextConfig
