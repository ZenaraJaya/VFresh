import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { applyOrderStatusStock } from '@/lib/daily-pack';

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z
    .enum([
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'HEADING_TO_VENDOR',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ])
    .optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  delayReason: z.string().max(1000).optional(),
  delayProof: z.string().max(400_000).optional(),
  proofTakenAt: z.string().optional(),
  proofLat: z.number().optional(),
  proofLng: z.number().optional(),
});

// GET - Full order detail. Admin only: orders carry employee contact details.
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        company: true,
        items: { include: { menuItem: true } }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH - Move an order through the fulfilment statuses.
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parsed = patchSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isOwnerVendor =
      session.user.role === 'VENDOR' &&
      session.user.vendorStatus === 'APPROVED' &&
      existing.vendorId === session.user.id;

    if (!isAdmin && !isOwnerVendor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, paymentStatus, delayReason, delayProof, proofTakenAt, proofLat, proofLng } =
      parsed.data;
    if (!isAdmin && paymentStatus) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (status) {
      try {
        const order = await applyOrderStatusStock(id, status, {
          delayReason,
          delayProof,
          proofTakenAt,
          proofLat,
          proofLng,
        });
        if (paymentStatus) {
          const paid = await prisma.order.update({
            where: { id },
            data: {
              paymentStatus,
              ...(paymentStatus === 'PAID' ? { paidAt: new Date() } : {}),
            },
            include: {
              company: { select: { id: true, name: true } },
              items: { include: { menuItem: true } },
            },
          });
          return NextResponse.json(paid);
        }
        return NextResponse.json(order);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Could not update order' },
          { status: 400 }
        );
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(paymentStatus === 'PAID' ? { paidAt: new Date() } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
