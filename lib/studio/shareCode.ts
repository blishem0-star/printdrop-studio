import type { DesignDocument } from './types';

// Shareable design links: a compact subset of the design document is encoded
// into a URL-safe base64 string so a shared /design?d=... link reopens the
// actual design (uploads are excluded - data URLs are far too large for URLs).

export type ShareableDesign = Pick<DesignDocument,
  'version'|'colorId'|'size'|'activeView'|'layers'|'printArea'|'printBg'>;

const MAX_CODE_LENGTH = 6000;

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): Uint8Array | null {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function encodeDesignShare(doc: ShareableDesign): string | null {
  try {
    const code = toBase64Url(new TextEncoder().encode(JSON.stringify(doc)));
    return code.length > MAX_CODE_LENGTH ? null : code;
  } catch {
    return null;
  }
}

export function decodeDesignShare(code: string): Partial<DesignDocument> | null {
  if (!code || code.length > MAX_CODE_LENGTH) return null;
  const bytes = fromBase64Url(code);
  if (!bytes) return null;
  try {
    const doc = JSON.parse(new TextDecoder().decode(bytes));
    if (!doc || typeof doc !== 'object' || doc.version !== 1) return null;
    if (doc.layers !== undefined && !Array.isArray(doc.layers)) return null;
    // Never allow uploads/aiSvg through a share link - they are not encoded
    // by us, so anything present is a forged payload.
    delete doc.uploads; delete doc.aiSvg; delete doc.aiPrompt;
    return doc as Partial<DesignDocument>;
  } catch {
    return null;
  }
}
