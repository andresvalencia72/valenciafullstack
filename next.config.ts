import path from "node:path";
import type { NextConfig } from "next";
import { securityHeaders } from "@/shared/config/security-headers";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly so Next.js doesn't misdetect it from
  // unrelated lockfiles that may exist elsewhere on a developer's machine.
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        // Applies to every route and asset.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
