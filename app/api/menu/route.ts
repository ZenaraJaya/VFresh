import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VENDOR_HOURS_SELECT } from '@/lib/vendor-availability';

// GET - Public menu. Only available items, optionally filtered by category.
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');

    const menuItems = await prisma.menuItem.findMany({
      where: {
        available: true,
        vendor: { status: 'APPROVED' },
        ...(category && category !== 'ALL' ? { category } : {})
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            ...VENDOR_HOURS_SELECT,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
