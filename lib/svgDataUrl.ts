// btoa() throws on any character outside Latin-1 (emoji, Hebrew, curly quotes…),
// so SVG markup must be URL-encoded — Unicode-safe and supported by <img>/<image>.
export function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
