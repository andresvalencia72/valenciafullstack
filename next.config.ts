import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "@/shared/config/security-headers";

const nextConfig: NextConfig = {
  // Emits `.next/standalone` (a self-contained server.js + traced
  // node_modules subset) so the production Docker image (PR15,
  // infra/README.md) doesn't need to ship the full source tree or a
  // `next start`-capable node_modules. Safe to enable unconditionally —
  // it only changes `next build`'s output shape, not `next dev`/`next start`
  // run-from-source behavior used in local dev and CI.
  output: "standalone",
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
