import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { materializeStandingOrders } from '@/lib/standing-orders';
import { compareDeliveryPriority } from '@/lib/order-priority';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await materializeStandingOrders(session.user.id);
  } catch (err) {
    console.error('standing orders', err);
  }

  const orders = await prisma.order.findMany({
    where: { vendorId: session.user.id },
    take: 200,
    include: {
      company: { select: { name: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  });

  orders.sort(compareDeliveryPriority);
  return NextResponse.json(orders);
}
