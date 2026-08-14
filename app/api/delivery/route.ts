import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { markOrderReceived } from '@/lib/daily-pack';
import {
  ackDeliveryOrder,
  claimDeliveryOrder,
  deliveryOrderJson,
  getDeliveryOrderById,
  getDeliveryOrderByNumber,
  headingToVendor,
  listOpenDeliveryRuns,
  markPickedUp,
} from '@/lib/delivery-orders';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  orderNumber: z.string().min(1),
  action: z.enum(['head_to_vendor', 'pickup', 'complete', 'ack']),
  delayReason: z.string().max(1000).optional(),
  delayProof: z.string().max(400_000).optional(),
});

async function requireRider() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'Session expired. Refresh, then try again.', status: 401 as const };
  }
  if (session.user.role !== 'DELIVERY') {
    return {
      error: 'This action needs a rider account. Log out of your other login first.',
      status: 403 as const,
    };
  }
  return { session };
}

export async function GET(req: NextRequest) {
  const rider = await requireRider();
  if ('error' in rider) {
    return NextResponse.json({ error: rider.error }, { status: rider.status });
  }

  try {
    const orderNumber = req.nextUrl.searchParams.get('orderNumber')?.trim();
    if (orderNumber) {
      const order = await getDeliveryOrderByNumber(orderNumber);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(deliveryOrderJson(order), {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const orders = await listOpenDeliveryRuns(rider.session.user.id);
    return NextResponse.json(
      { orders: orders.map((order) => deliveryOrderJson(order)) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('GET /api/delivery', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not load runs',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rider = await requireRider();
    if ('error' in rider) {
      return NextResponse.json({ error: rider.error }, { status: rider.status });
    }

    const parsed = postSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const existing = await getDeliveryOrderByNumber(parsed.data.orderNumber.trim());
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (parsed.data.action === 'ack') {
      if (existing.status === 'DELIVERED' || existing.status === 'CANCELLED') {
        return NextResponse.json(
          { error: 'This order is already finished' },
          { status: 400 }
        );
      }
      await claimDeliveryOrder(existing.id, {
        id: rider.session.user.id,
        name: rider.session.user.name,
      });
      await ackDeliveryOrder(existing.id);
    } else if (parsed.data.action === 'head_to_vendor') {
      await headingToVendor(existing.id, {
        id: rider.session.user.id,
        name: rider.session.user.name,
      });
    } else if (parsed.data.action === 'pickup') {
      if (existing.status === 'DELIVERED' || existing.status === 'CANCELLED') {
        return NextResponse.json(
          { error: 'This order is no longer out for delivery' },
          { status: 400 }
        );
      }
      await markPickedUp(existing.id, {
        id: rider.session.user.id,
        name: rider.session.user.name,
      });
    } else {
      await markOrderReceived(existing.id, {
        delayReason: parsed.data.delayReason,
        delayProof: parsed.data.delayProof,
      });
    }

    const order = await getDeliveryOrderById(existing.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(deliveryOrderJson(order));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not update delivery' },
      { status: 400 }
    );
  }
}
