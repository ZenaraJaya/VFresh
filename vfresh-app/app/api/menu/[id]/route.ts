import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

// GET - Single menu item, for the product detail page.
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const menuItem = await prisma.menuItem.findUnique({ where: { id } });

    if (!menuItem) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(menuItem);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}
