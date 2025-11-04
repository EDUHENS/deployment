/** @type {import('next').NextConfig} */

const nextConfig = {
  allowedDevOrigins: ['localhost', '192.168.100.45'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
}

module.exports = nextConfig
