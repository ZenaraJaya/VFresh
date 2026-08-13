import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  paymentMethod: z.enum(['COMPANY_ACCOUNT', 'CREDIT_CARD']).optional(),
});

async function customerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER') return null;
  return session;
}

export async function GET() {
  const session = await customerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const me = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      paymentMethod: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  });

  if (!me) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(me);
}

export async function PATCH(req: Request) {
  const session = await customerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
  }

  const data: {
    name?: string;
    phone?: string | null;
    paymentMethod?: 'COMPANY_ACCOUNT' | 'CREDIT_CARD';
  } = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.phone !== undefined) {
    data.phone = parsed.data.phone.trim() || null;
  }
  if (parsed.data.paymentMethod) data.paymentMethod = parsed.data.paymentMethod;

  const me = await prisma.customer.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      paymentMethod: true,
      companyId: true,
    },
  });

  return NextResponse.json(me);
}
