import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { waMeHref, smsHref } from '@/lib/phone';

export const dynamic = 'force-dynamic';

const NOTIFY_COOLDOWN_MS = 90_000;

const schema = z.object({
  note: z.string().max(240).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      vendorId: true,
      status: true,
      deliveryLocation: true,
      riderNotifiedAt: true,
    },
  });

  if (!order || order.vendorId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'This order is already finished' },
      { status: 400 }
    );
  }

  if (
    order.riderNotifiedAt &&
    Date.now() - order.riderNotifiedAt.getTime() < NOTIFY_COOLDOWN_MS
  ) {
    return NextResponse.json(
      { error: 'Wait a moment before notifying again.' },
      { status: 429 }
    );
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.user.id },
    select: { businessName: true, deliveryPhone: true },
  });

  const note =
    parsed.data.note?.trim() ||
    'Kitchen is waiting — please update this order (pickup or arrival).';

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      riderNotifiedAt: new Date(),
      riderNotifyNote: note,
    },
    select: {
      id: true,
      orderNumber: true,
      riderNotifiedAt: true,
      riderNotifyNote: true,
      riderAckAt: true,
    },
  });

  const origin =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const desk = `${origin || ''}/delivery`;
  const text = `${vendor?.businessName ?? 'Kitchen'}: ${note}\nOrder ${order.orderNumber}\n${order.deliveryLocation}\nOpen ${desk} and enter the order number.`;

  const phone = vendor?.deliveryPhone ?? '';
  return NextResponse.json({
    ...updated,
    awaitingReply: true,
    deliveryPhone: phone || null,
    whatsapp: phone ? waMeHref(phone, text) : null,
    sms: phone ? smsHref(phone, text) : null,
  });
}
