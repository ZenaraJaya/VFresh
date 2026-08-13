import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isVendorAcceptingOrders } from '@/lib/vendor-availability';

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

  const [vendor, menuCount, availableCount, newOrders, recentOrders] =
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
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: { include: { menuItem: { select: { name: true } } } },
        },
      }),
    ]);

  if (!vendor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    accepting: isVendorAcceptingOrders(vendor),
    address: vendor.address,
    slug: vendor.slug,
    businessName: vendor.businessName,
    menuCount,
    availableCount,
    newOrders,
    recentOrders,
  });
}
