# Third-party assets

## Devicon brand icons (skills section)

`src/features/home/ui/icons/` vendors 10 SVG files sourced directly from the
[devicon](https://github.com/devicons/devicon) npm package, version 2.17.0,
[MIT licensed](https://github.com/devicons/devicon/blob/master/LICENSE) (©
2015 konpa). They replace the monogram placeholder `SkillBadge` used prior to
this change (see `skill-badge.tsx`'s history for the original documented
deviation).

### Why vendored SVGs, not the devicon icon font/CDN

The design-reference mockup uses devicon's icon font (`<i class="devicon-*">`)
loaded from a CDN. That approach is incompatible with ADR-0007's `style-src
'self'` CSP (no external stylesheets) and self-hosting the full font would
mean shipping hundreds of unused glyphs for the 10 icons this page actually
needs. Instead, each icon's raw SVG markup is copied into a small, dedicated
React component — self-hosted, CSP-compliant, and only the bytes actually
used.

### Files and provenance

| Component | Source file (devicon `icons/`) | Notes |
|---|---|---|
| `docker-icon.tsx` | `docker/docker-original.svg` | |
| `figma-icon.tsx` | `figma/figma-original.svg` | |
| `git-icon.tsx` | `git/git-original.svg` | |
| `javascript-icon.tsx` | `javascript/javascript-original.svg` | |
| `nodejs-icon.tsx` | `nodejs/nodejs-original.svg` | Gradient ids namespaced (`nodejs-icon-*`) to avoid colliding with `php-icon.tsx`'s own upstream `id="a"` when both render on the same page |
| `php-icon.tsx` | `php/php-original.svg` | Gradient id namespaced (`php-icon-a`), see above |
| `postgresql-icon.tsx` | `postgresql/postgresql-original.svg` | |
| `react-icon.tsx` | `react/react-original.svg` | |
| `typescript-icon.tsx` | `typescript/typescript-original.svg` | |
| `nextjs-icon.tsx` | `nextjs/nextjs-plain.svg` | `fill="currentColor"` added (not present upstream) — see below |

The design-reference's `-plain colored` CSS classes (docker, figma, git,
javascript, nodejs, php, postgresql, typescript) map to devicon's
`-original.svg` files, which are the inherently multi-color variants; the
plain `.svg`s are simplified/single-path and meant to be styled via CSS,
which is exactly what the font's `.colored` class did. React's reference
class was already `-original`, so it maps directly.

### Next.js: the one icon that isn't colored

Next.js's devicon mark has no fixed brand color; devicon ships it as
`nextjs-plain.svg` with an unset (browser-default-black) fill — invisible
against a dark background. This component explicitly sets
`fill="currentColor"` on the path (not present in the upstream file) so the
mark inherits whatever text color the surrounding tone context provides
(e.g. the "Learning now" wide card's `text-coral-ink`), staying legible in
both light and dark themes without a hardcoded color value.

### Fetching a fresh copy

The npm package itself is **not** a project dependency (`npm pack` was used
once, out-of-band, to extract only the 10 needed files — see this change's
apply notes in `openspec/changes/portfolio-site/tasks.md`). To re-fetch or
verify against a newer devicon release:

```bash
npm pack devicon@<version> --pack-destination /tmp/devicon-fetch
tar -xzf /tmp/devicon-fetch/devicon-<version>.tgz -C /tmp/devicon-fetch/extracted \
  package/icons/<name>/<name>-original.svg
```
