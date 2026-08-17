import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  VENDOR_LIST_SELECT,
  vendorWarningMap,
  withWarnings,
} from '@/lib/vendor-moderation-db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [vendors, warnings] = await Promise.all([
      prisma.vendor.findMany({
        orderBy: { createdAt: 'desc' },
        select: VENDOR_LIST_SELECT,
      }),
      vendorWarningMap(),
    ]);

    return NextResponse.json(
      vendors.map((vendor) => withWarnings(vendor, warnings.get(vendor.id)))
    );
  } catch (error) {
    console.error('GET /api/admin/vendors', error);
    return NextResponse.json(
      { error: 'Could not load vendors' },
      { status: 500 }
    );
  }
}
