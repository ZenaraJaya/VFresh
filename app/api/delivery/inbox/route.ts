import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isDeliveryLate, riderAwaitingReply } from '@/lib/delivery-sla';
import { listDeliveryInbox } from '@/lib/delivery-orders';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'DELIVERY') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await listDeliveryInbox(session.user.id);
    const items = orders
      .map((order) => {
        const ping = riderAwaitingReply(order);
        const late = isDeliveryLate(order);
        const kitchen = order.vendor?.businessName ?? 'Kitchen';
        const href = `/delivery?o=${encodeURIComponent(order.orderNumber)}`;

        if (ping) {
          return {
            id: order.id,
            href,
            kind: 'ping' as const,
            title: `${kitchen} needs a reply`,
            body: order.riderNotifyNote?.trim() || order.orderNumber,
            at: order.riderNotifiedAt
              ? new Date(order.riderNotifiedAt).toISOString()
              : new Date(order.updatedAt).toISOString(),
            unread: true,
          };
        }

        if (late && order.courierId === session.user.id) {
          return {
            id: order.id,
            href,
            kind: 'late' as const,
            title: `${order.orderNumber} is over 1 hour`,
            body: order.deliveryLocation,
            at: new Date(order.updatedAt).toISOString(),
            unread: true,
          };
        }

        if (order.courierId === session.user.id) {
          return {
            id: order.id,
            href,
            kind: 'run' as const,
            title: order.orderNumber,
            body: `${kitchen} · ${order.deliveryLocation}`,
            at: new Date(order.updatedAt).toISOString(),
            unread: false,
          };
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => Number(b.unread) - Number(a.unread) || b.at.localeCompare(a.at));

    return NextResponse.json(
      {
        items,
        unread: items.filter((item) => item.unread).length,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('GET /api/delivery/inbox', error);
    return NextResponse.json({ items: [], unread: 0 });
  }
}
