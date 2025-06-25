/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações de imagem
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || '',
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Configurações de headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
  
  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Configurações de build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configurações de output para Docker
  output: 'standalone',
  
  // Configurações experimentais
  experimental: {
    // Habilitar App Router
    appDir: true,
  },
  
  // Configurações de TypeScript
  typescript: {
    // Ignorar erros de build no TypeScript em produção (apenas para build inicial)
    ignoreBuildErrors: false,
  },
  
  // Configurações de ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig; 