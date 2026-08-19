import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  PAYMENT_HOLD_EXPIRED,
  paymentHoldCustomerMessage,
  releaseExpiredPaymentHolds,
} from '@/lib/payment-hold';

export const dynamic = 'force-dynamic';

async function customerId() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER') return null;
  return session.user.id;
}

export async function GET() {
  const id = await customerId();
  if (!id) {
    return NextResponse.json({ notices: [] });
  }

  try {
    await releaseExpiredPaymentHolds();
  } catch (err) {
    console.error('payment hold release', err);
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId: id,
      cancelReason: PAYMENT_HOLD_EXPIRED,
      customerAlertSeenAt: null,
    },
    select: { orderNumber: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });

  return NextResponse.json({
    notices: orders.map((order) => ({
      orderNumber: order.orderNumber,
      message: paymentHoldCustomerMessage(order.orderNumber),
    })),
  });
}

export async function POST() {
  const id = await customerId();
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.order.updateMany({
    where: {
      customerId: id,
      cancelReason: PAYMENT_HOLD_EXPIRED,
      customerAlertSeenAt: null,
    },
    data: { customerAlertSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
