import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

const US_STATE_RE  = /^[A-Z]{2}$/;
const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_RE       = /^#[0-9A-Fa-f]{6}$/;
const VALID_SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHIPPING_PRICE = 4.99;
const CUSTOM_DESIGN_PRICE = 24.99;

function validateBody(b: Record<string, unknown>): string | null {
  const str = (k: string) => (typeof b[k] === 'string' ? (b[k] as string).trim() : '');
  if (str('customerName').length < 2)       return 'Invalid name';
  if (!EMAIL_RE.test(str('customerEmail'))) return 'Invalid email';
  if (str('shippingName').length < 2)       return 'Invalid shipping name';
  if (str('shippingAddr').length < 5)       return 'Invalid address';
  if (str('shippingCity').length < 2)       return 'Invalid city';
  if (!/^\d{5}$/.test(str('shippingZip'))) return 'Invalid ZIP (must be 5 digits)';
  if (!US_STATE_RE.test(str('shippingState'))) return 'Invalid state';
  const d = b.design as Record<string, unknown> | undefined;
  if (!d || typeof d.title !== 'string' || !d.title.trim()) return 'Invalid design title';
  if ((d.title as string).length > 120) return 'Design title too long';
  if (typeof d.colorHex !== 'string' || !HEX_RE.test(d.colorHex as string)) return 'Invalid design color';
  if (typeof d.size !== 'string' || !VALID_SIZES.includes(d.size as string)) return 'Invalid design size';
  if (d.customText && typeof d.customText === 'string' && (d.customText as string).length > 200) return 'Custom text too long';
  return null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`order:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many orders. Try again in an hour.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const err = validateBody(body);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const {
    customerName, customerEmail,
    shippingName, shippingAddr, shippingCity, shippingZip, shippingState,
    design,
  } = body as {
    customerName: string; customerEmail: string;
    shippingName: string; shippingAddr: string; shippingCity: string;
    shippingZip: string; shippingState: string;
    design: { title: string; emoji?: string; customText?: string; colorHex: string; colorName: string; size: string; price?: number; svgDataUrl?: string; filePath?: string; artistDesignId?: string };
  };

  // Server-side price calculation — never trust client total
  let authorizedPrice: number;
  if (design.artistDesignId) {
    const artistDesign = await prisma.artistDesign.findUnique({
      where: { id: design.artistDesignId, status: 'APPROVED' },
      select: { price: true },
    });
    if (!artistDesign) return NextResponse.json({ error: 'Design not available' }, { status: 422 });
    authorizedPrice = artistDesign.price;
  } else {
    authorizedPrice = CUSTOM_DESIGN_PRICE;
  }
  const total = parseFloat((authorizedPrice + SHIPPING_PRICE).toFixed(2));

  const customer = await prisma.customer.upsert({
    where: { email: customerEmail.toLowerCase().trim() },
    update: { name: customerName },
    create: { name: customerName, email: customerEmail.toLowerCase().trim() },
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
      artistDesignId: design.artistDesignId ?? null,
    },
  });

  // Credit artist 50% when their design is sold
  if (design.artistDesignId) {
    await prisma.artistDesign.update({
      where: { id: design.artistDesignId },
      data: { salesCount: { increment: 1 }, totalEarned: { increment: authorizedPrice * 0.5 } },
    }).catch(() => null);
  }

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
      items: { create: { designAssetId: designAsset.id, qty: 1, unitPrice: authorizedPrice } },
    },
    include: { customer: true, items: { include: { designAsset: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}
