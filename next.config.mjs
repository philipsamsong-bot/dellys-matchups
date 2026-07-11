// File: next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "dellysmatchups.org",
      },
      {
        protocol: "https",
        hostname: "www.dellysmatchups.org",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*\\.(webp|avif|svg|png|jpg|jpeg|gif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
