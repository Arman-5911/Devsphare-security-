/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@devsphere/shared', '@devsphere/scanner-core'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`
          : 'http://127.0.0.1:4000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
