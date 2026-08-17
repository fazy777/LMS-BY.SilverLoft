/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin', 'mysql2', 'stripe'],
};

export default nextConfig;
