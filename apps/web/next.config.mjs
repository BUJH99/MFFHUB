/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mff-data-hub/types', '@mff-data-hub/core', '@mff-data-hub/account', '@mff-data-hub/db', '@mff-data-hub/data'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'thanosvibs.money' },
      { protocol: 'https', hostname: 'ui-avatars.com' }
    ]
  }
};

export default nextConfig;
