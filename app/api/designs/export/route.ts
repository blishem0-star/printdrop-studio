import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { svgDataUrl } = await req.json();

  if (!svgDataUrl || !svgDataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 });
  }

  const [header, base64] = svgDataUrl.split(',');
  const ext = header.includes('svg') ? 'svg' : 'png';
  const filename = `${randomUUID()}.${ext}`;
  const filePath = join(process.cwd(), 'public', 'designs', filename);

  await writeFile(filePath, Buffer.from(base64, 'base64'));

  return NextResponse.json({ filePath: `/designs/${filename}` });
}
