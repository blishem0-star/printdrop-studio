import DOMPurify from 'isomorphic-dompurify';

// Real DOM-based sanitization (replaces the old regex stripping, which was bypassable).
// SVG profile only; foreignObject/use are removed to block HTML smuggling and external refs.
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['foreignObject', 'use', 'script', 'style', 'animate', 'set'],
    FORBID_ATTR: ['href', 'xlink:href'],
  });
}
