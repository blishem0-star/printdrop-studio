import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".backup/**",
    // Generated Prisma client — machine-written, not subject to lint
    "lib/generated/**",
    // Standalone dev tool (axe-core a11y audit runner), not app code
    "verify-a11y.mjs",
    // Agent tooling (autonomous improver runner) — not part of the app
    "agents/**",
  ]),
  {
    // These pages render user-generated designs as data-URLs (SVG/base64);
    // next/image provides no optimization for data: sources, so <img> is correct.
    files: ["app/artist/page.tsx", "app/admin/artists/page.tsx", "app/design/page.tsx", "app/catalog/page.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;
