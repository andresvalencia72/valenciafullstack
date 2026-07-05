/**
 * Security headers applied to every response, wired into `next.config.ts`
 * via the `headers()` async function.
 *
 * CSP strategy (ADR-0007, docs/adr/0007-csp-script-src-strategy.md):
 * `script-src` and `style-src` are both `'self' 'unsafe-inline'`; hash-
 * or nonce-based `script-src` is rejected as unimplementable on the App
 * Router (dynamic inline RSC scripts cannot be pre-hashed, and nonces
 * would force dynamic rendering on every request). Compensating controls
 * are the remaining hardened headers below and the absence of any
 * third-party script sources. This is a deliberate, documented tradeoff
 * — see the `security` capability spec and design.md > Resolved
 * Decisions for the full rationale. No further tightening is planned
 * beyond PR11's verification pass.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

export const securityHeaders: { key: string; value: string }[] = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
];
