import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 本番環境用の設定
  output: 'standalone',
  
  // 画像最適化
  images: {
    domains: ['line.me', 'profile.line-scdn.net'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // セキュリティヘッダー
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
        ],
      },
    ];
  },
  
  // 環境変数の検証
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
