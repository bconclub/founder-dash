/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize large dependencies to reduce serverless function size
      config.externals = [
        '@supabase/supabase-js',
        '@supabase/ssr',
        'fs',
        'path',
        'crypto',
        ...(config.externals || [])
      ]
      // Prevent bundling of parent directories
      config.resolve.modules = [
        'node_modules',
        require('path').resolve(__dirname, 'src'),
      ]
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://goproxe.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

