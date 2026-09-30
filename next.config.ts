import type { NextConfig } from "next";

// Read once so a missing value is reported at startup rather than silently
// producing an `undefined/...` destination.
const BACKEND_URL = process.env.BACKEND_URL;

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
  rewrites() {
    if (!BACKEND_URL) {
      console.warn(
        "[next.config] BACKEND_URL is not set — /api/* will 404. Copy .env.example to .env.local."
      );
      return [];
    }

    // Same-origin proxy: the browser only ever calls `/api/...` on this app's
    // own domain, and Next forwards it to the backend server-side. Keeps the
    // backend address out of the browser and avoids CORS entirely.
    //
    // A plain array is applied `afterFiles`, so a Route Handler added later
    // under `app/api/...` wins over the proxy.
    //
    // `/api` is repeated in the destination on purpose: only `:path*` is carried
    // over, so `${BACKEND_URL}/:path*` would send /api/clients to /clients.
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
