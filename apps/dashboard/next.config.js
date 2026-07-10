/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@conversation-platform/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
