import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

// GET - Single company. Billing fields are omitted: this endpoint is public and
// only exists so checkout can confirm the selected account is still active.
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const company = await prisma.company.findFirst({
      where: { id, isActive: true },
      select: { id: true, name: true, isActive: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}
