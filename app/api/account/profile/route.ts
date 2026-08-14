import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizeMyPhone } from '@/lib/phone';

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  jobTitle: z.string().max(80).optional(),
  paymentMethod: z.enum(['COMPANY_ACCOUNT', 'CREDIT_CARD']).optional(),
  billingName: z.string().max(120).optional(),
  billingEmail: z.union([z.email(), z.literal('')]).optional(),
  billingPhone: z.string().max(40).optional(),
  billingAddress: z.string().max(240).optional(),
  billingCity: z.string().max(80).optional(),
  billingPostcode: z.string().max(12).optional(),
  billingState: z.string().max(80).optional(),
  cardholderName: z.string().max(120).optional(),
  cardBrand: z.string().max(40).optional(),
  cardLast4: z.union([z.string().regex(/^\d{4}$/), z.literal('')]).optional(),
  cardExpMonth: z.number().int().min(1).max(12).nullable().optional(),
  cardExpYear: z.number().int().min(2024).max(2100).nullable().optional(),
});

async function customerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER') return null;
  return session;
}

const publicSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  jobTitle: true,
  paymentMethod: true,
  companyId: true,
  companyRole: true,
  billingName: true,
  billingEmail: true,
  billingPhone: true,
  billingAddress: true,
  billingCity: true,
  billingPostcode: true,
  billingState: true,
  cardholderName: true,
  cardBrand: true,
  cardLast4: true,
  cardExpMonth: true,
  cardExpYear: true,
  company: { select: { id: true, name: true } },
} as const;

export async function GET() {
  const session = await customerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const me = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: publicSelect,
  });

  if (!me) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(me);
}

function emptyToNull(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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

  const p = parsed.data;
  const me = await prisma.customer.update({
    where: { id: session.user.id },
    data: {
      name: p.name?.trim(),
      phone: p.phone !== undefined ? normalizeMyPhone(p.phone) : undefined,
      jobTitle: emptyToNull(p.jobTitle),
      paymentMethod: p.paymentMethod,
      billingName: emptyToNull(p.billingName),
      billingEmail: emptyToNull(p.billingEmail),
      billingPhone:
        p.billingPhone !== undefined
          ? normalizeMyPhone(p.billingPhone)
          : undefined,
      billingAddress: emptyToNull(p.billingAddress),
      billingCity: emptyToNull(p.billingCity),
      billingPostcode: emptyToNull(p.billingPostcode),
      billingState: emptyToNull(p.billingState),
      cardholderName: emptyToNull(p.cardholderName),
      cardBrand: emptyToNull(p.cardBrand),
      cardLast4: emptyToNull(p.cardLast4),
      cardExpMonth: p.cardExpMonth === undefined ? undefined : p.cardExpMonth,
      cardExpYear: p.cardExpYear === undefined ? undefined : p.cardExpYear,
    },
    select: publicSelect,
  });

  return NextResponse.json(me);
}
