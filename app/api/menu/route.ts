import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Public menu. Only available items, optionally filtered by category.
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');

    const menuItems = await prisma.menuItem.findMany({
      where: {
        available: true,
        ...(category && category !== 'ALL' ? { category } : {})
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
