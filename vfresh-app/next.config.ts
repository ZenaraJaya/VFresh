import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Menu item images are stored as remote URLs (see MenuForm's upload stub).
    // `images.domains` is deprecated in Next 16 — remotePatterns only.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
