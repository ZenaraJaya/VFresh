import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const companySchema = z.object({
  name: z.string().min(1).max(160),
  billingEmail: z.email(),
  billingAddress: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});

// GET - All company accounts with their order counts.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { orders: true } } }
    });

    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST - Open a new corporate account.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = companySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid company' }, { status: 400 });
    }

    const data = parsed.data;

    // `name` is unique in the schema — surface the clash rather than a 500.
    const existing = await prisma.company.findUnique({
      where: { name: data.name.trim() }
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A company with that name already exists' },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: data.name.trim(),
        billingEmail: data.billingEmail.toLowerCase().trim(),
        billingAddress: data.billingAddress?.trim() || null,
        phone: data.phone?.trim() || null,
        isActive: data.isActive
      }
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
