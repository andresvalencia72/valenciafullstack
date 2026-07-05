import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
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

// `app/` lives at the repo root (screaming architecture — see design.md),
// so the request config does not live at the framework's default
// `./i18n/request.ts` path; point the plugin at its actual location.
const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

export default withNextIntl(nextConfig);
