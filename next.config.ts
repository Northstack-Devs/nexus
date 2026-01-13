import type { NextConfig } from "next";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexHostname = convexUrl ? new URL(convexUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: convexHostname
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: convexHostname,
            pathname: "/api/storage/**",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
