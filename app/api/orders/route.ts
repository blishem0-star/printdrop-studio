import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  const body = await req.json();
  const {
    customerName, customerEmail,
    shippingName, shippingAddr, shippingCity, shippingZip, shippingState,
    total,
    design,
  } = body;

  // Upsert customer
  const customer = await prisma.customer.upsert({
    where: { email: customerEmail },
    update: { name: customerName },
    create: { name: customerName, email: customerEmail },
  });

  // Create design asset
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

  // Create order + item
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
      items: {
        create: {
          designAssetId: designAsset.id,
          qty: 1,
          unitPrice: design.price,
        },
      },
    },
    include: {
      customer: true,
      items: { include: { designAsset: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
