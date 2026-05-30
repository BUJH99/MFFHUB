/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['@mff-data-hub/types', '@mff-data-hub/core', '@mff-data-hub/account', '@mff-data-hub/db', '@mff-data-hub/data'],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'thanosvibs.money' },
      { protocol: 'https', hostname: 'ui-avatars.com' }
    ]
  }
};

export default nextConfig;
