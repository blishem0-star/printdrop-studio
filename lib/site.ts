// Single source of truth for the public site origin. Changing the domain
// at launch = set NEXT_PUBLIC_SITE_URL (no trailing slash) and rebuild.
// SEO surfaces (canonical, OG, JSON-LD, sitemap, robots) all import this.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') || 'https://stylx.ai';
