import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const { customerId, name, email } = await req.json();
    if (!customerId || (!name && !email)) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const existing = email ? await prisma.customer.findFirst({ where: { email, NOT: { id: customerId } } }) : null;
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { ...(name && { name }), ...(email && { email }) },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
