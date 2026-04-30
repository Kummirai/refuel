import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  // Ensure proper handling of cookies
  experimental: {
    serverActions: {
      allowedOrigins: ["fuelex.netlify.app"],
    },
  },
};

export default nextConfig;
