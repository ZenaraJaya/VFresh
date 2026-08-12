import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      businessName: true,
      slug: true,
      phone: true,
      address: true,
      description: true,
      registrationNumber: true,
      premisesType: true,
      status: true,
      createdAt: true,
      _count: { select: { menuItems: true } },
    },
  });

  return NextResponse.json(vendors);
}
