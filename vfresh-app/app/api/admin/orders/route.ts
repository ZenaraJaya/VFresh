import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED'
] as const;

// GET - Order list for the admin table, filterable by status and company.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const status = params.get('status');
    const companyId = params.get('companyId');

    const where: Prisma.OrderWhereInput = {
      ...(status && STATUSES.includes(status as (typeof STATUSES)[number])
        ? { status: status as (typeof STATUSES)[number] }
        : {}),
      ...(companyId ? { companyId } : {})
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        company: { select: { id: true, name: true } },
        items: { include: { menuItem: { select: { id: true, name: true } } } }
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/admin/orders failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
