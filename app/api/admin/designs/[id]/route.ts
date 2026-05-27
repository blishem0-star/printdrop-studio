import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 422 });
    }
    const design = await prisma.artistDesign.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(design);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
