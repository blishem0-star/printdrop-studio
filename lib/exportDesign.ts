'use client';

function escapeXml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function buildDesignSvg(opts: {
  colorHex: string;
  textColor: string;
  emoji?: string;
  label?: string;
  customText?: string;
}): string {
  const { colorHex, textColor, emoji, label, customText } = opts;

  const emojiLine = emoji
    ? `<text x="100" y="140" text-anchor="middle" font-size="42" dominant-baseline="middle">${escapeXml(emoji)}</text>`
    : '';
  const labelLine = label
    ? `<text x="100" y="${emoji ? 168 : 145}" text-anchor="middle" font-size="12" fill="${escapeXml(textColor)}" font-family="system-ui, sans-serif" font-weight="700" letter-spacing="1" dominant-baseline="middle" opacity="0.9">${escapeXml(label.toUpperCase())}</text>`
    : '';
  const customLine = customText
    ? `<text x="100" y="${emoji || label ? 192 : 145}" text-anchor="middle" font-size="9" fill="${escapeXml(textColor)}" font-family="system-ui, sans-serif" font-weight="800" letter-spacing="2" dominant-baseline="middle" opacity="0.65">${escapeXml(customText.toUpperCase().slice(0, 22))}</text>`
    : '';

  const svg = `<svg width="200" height="230" viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colorHex}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${colorHex}" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <path d="M30 55 L0 80 L25 95 L20 220 L180 220 L175 95 L200 80 L170 55 L145 70 Q130 30 100 28 Q70 30 55 70 Z" fill="url(#g)"/>
  <path d="M55 70 Q70 50 100 48 Q130 50 145 70 Q130 58 100 56 Q70 58 55 70 Z" fill="rgba(0,0,0,0.2)"/>
  ${emojiLine}
  ${labelLine}
  ${customLine}
</svg>`;

  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export async function saveDesignFile(svgDataUrl: string): Promise<string | null> {
  try {
    const res = await fetch('/api/designs/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svgDataUrl }),
    });
    if (!res.ok) return null;
    const { filePath } = await res.json();
    return filePath as string;
  } catch {
    return null;
  }
}

export async function submitOrder(payload: {
  customerName: string;
  customerEmail: string;
  shippingName: string;
  shippingAddr: string;
  shippingCity: string;
  shippingZip: string;
  shippingState: string;
  total: number;
  design: {
    title: string;
    emoji?: string;
    customText?: string;
    colorHex: string;
    colorName: string;
    size: string;
    price: number;
    svgDataUrl?: string;
    filePath?: string;
    artistDesignId?: string;
  };
}): Promise<{ id: string } | null> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
