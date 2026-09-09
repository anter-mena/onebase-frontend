import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        port: "",
        pathname: "/npm/simple-icons@v16/icons/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
