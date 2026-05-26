import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const US_STATE_RE = /^[A-Z]{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBody(b: Record<string, unknown>): string | null {
  const str = (k: string) => (typeof b[k] === 'string' ? (b[k] as string).trim() : '');
  if (str('customerName').length < 2)      return 'Invalid name';
  if (!EMAIL_RE.test(str('customerEmail'))) return 'Invalid email';
  if (str('shippingName').length < 2)      return 'Invalid shipping name';
  if (str('shippingAddr').length < 5)      return 'Invalid address';
  if (str('shippingCity').length < 2)      return 'Invalid city';
  if (!/^\d{5}$/.test(str('shippingZip'))) return 'Invalid ZIP (must be 5 digits)';
  if (!US_STATE_RE.test(str('shippingState'))) return 'Invalid state';
  if (typeof b.total !== 'number' || b.total <= 0) return 'Invalid total';
  const d = b.design as Record<string, unknown> | undefined;
  if (!d || typeof d.title !== 'string' || !d.title.trim()) return 'Invalid design title';
  if (typeof d.colorHex !== 'string' || !d.colorHex) return 'Invalid design color';
  if (typeof d.size !== 'string' || !d.size) return 'Invalid design size';
  if (typeof d.price !== 'number' || d.price <= 0) return 'Invalid design price';
  return null;
}

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      items: { include: { designAsset: true } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const err = validateBody(body);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const {
    customerName, customerEmail,
    shippingName, shippingAddr, shippingCity, shippingZip, shippingState,
    total, design,
  } = body as {
    customerName: string; customerEmail: string;
    shippingName: string; shippingAddr: string; shippingCity: string;
    shippingZip: string; shippingState: string;
    total: number;
    design: { title: string; emoji?: string; customText?: string; colorHex: string; colorName: string; size: string; price: number; svgDataUrl?: string; filePath?: string };
  };

  const customer = await prisma.customer.upsert({
    where: { email: customerEmail },
    update: { name: customerName },
    create: { name: customerName, email: customerEmail },
  });

  const designAsset = await prisma.designAsset.create({
    data: {
      title: design.title,
      emoji: design.emoji ?? null,
      customText: design.customText ?? null,
      colorHex: design.colorHex,
      colorName: design.colorName,
      size: design.size,
      svgDataUrl: design.svgDataUrl ?? null,
      filePath: design.filePath ?? null,
    },
  });

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      total,
      shippingName,
      shippingAddr,
      shippingCity,
      shippingZip,
      shippingState,
      status: 'PAID',
      items: { create: { designAssetId: designAsset.id, qty: 1, unitPrice: design.price } },
    },
    include: { customer: true, items: { include: { designAsset: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}
