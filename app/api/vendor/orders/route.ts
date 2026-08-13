import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { vendorId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      company: { select: { name: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  });

  return NextResponse.json(orders);
}
