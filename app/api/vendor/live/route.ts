import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isVendorAcceptingOrders, isVendorOnLunchBreak } from '@/lib/vendor-availability';
import type { WeeklyHours } from '@/lib/vendor-availability';
import { materializeStandingOrders } from '@/lib/standing-orders';
import { compareDeliveryPriority } from '@/lib/order-priority';
import { isDeliveryLate } from '@/lib/delivery-sla';

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

  const vendorId = session.user.id;
  try {
    await materializeStandingOrders(vendorId);
  } catch (err) {
    console.error('standing orders', err);
  }

  const [vendor, menuCount, availableCount, newOrders, upcoming] =
    await Promise.all([
      prisma.vendor.findUnique({ where: { id: vendorId } }),
      prisma.menuItem.count({ where: { vendorId } }),
      prisma.menuItem.count({
        where: { vendorId, available: true },
      }),
      prisma.order.count({
        where: {
          vendorId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      prisma.order.findMany({
        where: {
          vendorId,
          status: { notIn: ['DELIVERED', 'CANCELLED'] },
        },
        take: 40,
        include: {
          items: { include: { menuItem: { select: { name: true } } } },
        },
      }),
    ]);

  if (!vendor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    accepting: isVendorAcceptingOrders({
      ...vendor,
      weeklyHours: vendor.weeklyHours as WeeklyHours | null,
    }),
    onLunch: isVendorOnLunchBreak(vendor),
    address: vendor.address,
    slug: vendor.slug,
    businessName: vendor.businessName,
    menuCount,
    availableCount,
    newOrders,
    delayedDeliveries: upcoming.filter((o) => isDeliveryLate(o)).length,
    recentOrders: upcoming.sort(compareDeliveryPriority).slice(0, 5),
  });
}
