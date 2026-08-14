import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { weekdayName } from '@/lib/miri-date';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'CUSTOMER') {
    const me = await prisma.customer.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });
    const rows = await prisma.recurringOrder.findMany({
      where: {
        active: true,
        OR: [
          { customerId: session.user.id },
          {
            employeeEmail: {
              equals: session.user.email ?? '',
              mode: 'insensitive',
            },
          },
          ...(me?.companyId ? [{ companyId: me.companyId }] : []),
        ],
      },
      include: { vendor: { select: { businessName: true } } },
      orderBy: { weekday: 'asc' },
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        weekday: r.weekday,
        weekdayLabel: weekdayName(r.weekday),
        vendorName: r.vendor.businessName,
        deliveryLocation: r.deliveryLocation,
        deliveryTime: r.deliveryTime,
        employeeName: r.employeeName,
      }))
    );
  }

  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const rows = await prisma.recurringOrder.findMany({
    where: { employeeEmail: { equals: email, mode: 'insensitive' }, active: true },
    include: { vendor: { select: { businessName: true } } },
    orderBy: { weekday: 'asc' },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      weekday: r.weekday,
      weekdayLabel: weekdayName(r.weekday),
      vendorName: r.vendor.businessName,
      deliveryLocation: r.deliveryLocation,
      deliveryTime: r.deliveryTime,
      employeeName: r.employeeName,
    }))
  );
}

const patchSchema = z.object({
  id: z.string().min(1),
  email: z.email().optional(),
});

export async function PATCH(req: NextRequest) {
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'CUSTOMER') {
    const me = await prisma.customer.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });
    const existing = await prisma.recurringOrder.findFirst({
      where: {
        id: parsed.data.id,
        OR: [
          { customerId: session.user.id },
          {
            employeeEmail: {
              equals: session.user.email ?? '',
              mode: 'insensitive',
            },
          },
          ...(me?.companyId ? [{ companyId: me.companyId }] : []),
        ],
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.recurringOrder.update({
      where: { id: existing.id },
      data: { active: false },
    });
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Sign in or provide email' }, { status: 401 });
  }

  const existing = await prisma.recurringOrder.findFirst({
    where: {
      id: parsed.data.id,
      employeeEmail: { equals: email, mode: 'insensitive' },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.recurringOrder.update({
    where: { id: existing.id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
