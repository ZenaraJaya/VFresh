import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Active companies, for the checkout form's account picker.
// Only non-billing fields are exposed; billing details stay admin-only.
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
