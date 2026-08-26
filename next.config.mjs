// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vlrknvenayvxgmblvjsd.supabase.co',
        pathname: '/storage/v1/object/public/**', // Allow Supabase public storage URLs
      },
      {
        protocol: 'https',
        hostname: 'vlrknvenayvxgmblvjsd.storage.supabase.co',
        pathname: '/**', // ✅ แก้เป็น /** เพื่ออนุญาตทุกรูปจาก Supabase
      },
    ],
  },
};

export default nextConfig;
