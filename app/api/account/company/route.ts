import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizeMyPhone } from '@/lib/phone';

const schema = z.object({
  name: z.string().min(1).max(160),
  billingEmail: z.email(),
  billingAddress: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  jobTitle: z.string().max(80).optional().or(z.literal('')),
});

function nullIfBlank(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Company name and billing email are required.' },
      { status: 400 }
    );
  }

  const me = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: { id: true, companyId: true },
  });
  if (!me) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  if (me.companyId) {
    return NextResponse.json(
      { error: 'This account is already linked to a company.' },
      { status: 409 }
    );
  }

  const companyName = parsed.data.name.trim();
  const existing = await prisma.company.findUnique({
    where: { name: companyName },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'A company with that name already exists.' },
      { status: 409 }
    );
  }

  const jobTitle = nullIfBlank(parsed.data.jobTitle);
  const billingEmail = parsed.data.billingEmail.toLowerCase().trim();

  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: companyName,
        billingEmail,
        billingAddress: nullIfBlank(parsed.data.billingAddress),
        phone: normalizeMyPhone(parsed.data.phone) ?? null,
        isActive: false,
        status: 'PENDING',
        registeredById: me.id,
      },
    });

    await tx.customer.update({
      where: { id: me.id },
      data: {
        companyId: created.id,
        companyRole: 'OWNER',
        jobTitle: jobTitle ?? undefined,
        paymentMethod: 'COMPANY_ACCOUNT',
        billingEmail,
        billingAddress: nullIfBlank(parsed.data.billingAddress),
        billingPhone: normalizeMyPhone(parsed.data.phone) ?? null,
      },
    });

    return created;
  });

  return NextResponse.json(
    {
      company: {
        id: company.id,
        name: company.name,
        status: company.status,
      },
    },
    { status: 201 }
  );
}
