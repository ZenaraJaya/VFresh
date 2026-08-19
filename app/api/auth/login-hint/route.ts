import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { findCourierByEmail } from '@/lib/courier-lookup';
import { isCustomerDemoEmail } from '@/lib/demo-accounts';

const schema = z.object({
  email: z.email(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ status: 'invalid' });
  }

  const email = parsed.data.email.toLowerCase().trim();
  if (isCustomerDemoEmail(email)) {
    return NextResponse.json({ status: 'customer_demo_disabled' });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { email },
    select: { status: true },
  });

  if (vendor?.status === 'PENDING') {
    return NextResponse.json({ status: 'pending_review' });
  }
  if (vendor?.status === 'REJECTED') {
    return NextResponse.json({ status: 'rejected' });
  }
  if (vendor?.status === 'SUSPENDED') {
    return NextResponse.json({ status: 'suspended' });
  }
  if (vendor) {
    return NextResponse.json({ status: 'invalid' });
  }

  const [admin, customer, courier] = await Promise.all([
    prisma.admin.findUnique({ where: { email }, select: { id: true } }),
    prisma.customer.findUnique({ where: { email }, select: { id: true } }),
    findCourierByEmail(email),
  ]);

  if (admin || customer || courier) {
    return NextResponse.json({ status: 'invalid' });
  }

  return NextResponse.json({ status: 'unknown' });
}
