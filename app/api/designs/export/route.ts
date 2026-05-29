import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['data:image/svg+xml', 'data:image/png', 'data:image/jpeg', 'data:image/webp'];

export async function POST(req: NextRequest) {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BYTES * 1.4) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  let body: { svgDataUrl?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { svgDataUrl } = body;
  if (!svgDataUrl || typeof svgDataUrl !== 'string') {
    return NextResponse.json({ error: 'Missing data URL' }, { status: 400 });
  }

  const matched = ALLOWED_TYPES.find(t => svgDataUrl.startsWith(t));
  if (!matched) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const [, base64] = svgDataUrl.split(',');
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 413 });
  }

  const ext = matched.includes('svg') ? 'svg' : matched.includes('png') ? 'png' : matched.includes('webp') ? 'webp' : 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const filePath = join(process.cwd(), 'public', 'designs', filename);

  await writeFile(filePath, buffer);

  return NextResponse.json({ filePath: `/designs/${filename}` });
}
