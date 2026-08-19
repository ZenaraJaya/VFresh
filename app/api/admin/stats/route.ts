import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toMoney } from '@/lib/pricing';
import { USABLE_COMPANY_WHERE } from '@/lib/company';

// GET - Dashboard summary.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const since = new Date();
    since.setDate(since.getDate() - 13); // 14-day window, inclusive of today
    since.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      revenue,
      pendingOrders,
      activeCompanies,
      pendingCompanies,
      menuItemCount,
      recentOrders,
      windowOrders
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' } }
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.company.count({ where: USABLE_COMPANY_WHERE }),
      prisma.company.count({ where: { status: 'PENDING' } }),
      prisma.menuItem.count(),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          employeeName: true,
          status: true,
          total: true,
          createdAt: true,
          company: { select: { id: true, name: true } }
        }
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        select: { createdAt: true, total: true }
      })
    ]);

    // Bucket the window into days so the chart has a point for every day,
    // including days with no orders.
    const buckets = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const order of windowOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, buckets.get(key)! + order.total);
      }
    }

    return NextResponse.json({
      totalOrders,
      totalRevenue: toMoney(revenue._sum.total ?? 0),
      pendingOrders,
      activeCompanies,
      pendingCompanies,
      menuItemCount,
      recentOrders,
      revenueByDay: [...buckets.entries()].map(([date, total]) => ({
        date,
        revenue: toMoney(total)
      }))
    });
  } catch (error) {
    console.error('GET /api/admin/stats failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
