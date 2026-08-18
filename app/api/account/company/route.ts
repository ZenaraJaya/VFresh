import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizeMyPhone } from '@/lib/phone';

const schema = z.object({
  name: z.string().min(1).max(160),
  billingEmail: z.email(),
  billingAddress: z.string().min(1).max(500),
  phone: z.string().max(40).optional().or(z.literal('')),
  jobTitle: z.string().max(80).optional().or(z.literal('')),
});

function nullIfBlank(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function publicCompany(company: {
  id: string;
  name: string;
  status: string;
  billingEmail: string;
  billingAddress: string | null;
  phone: string | null;
}) {
  return {
    id: company.id,
    name: company.name,
    status: company.status,
    billingEmail: company.billingEmail,
    billingAddress: company.billingAddress,
    phone: company.phone,
  };
}

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER') return null;
  return session;
}

export async function POST(req: Request) {
  const session = await requireCustomer();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          'Company name, billing email, and billing address are required.',
      },
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
  const existing = await prisma.company.findFirst({
    where: { name: { equals: companyName, mode: 'insensitive' } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'A company with that name already exists.' },
      { status: 409 }
    );
  }

  const jobTitle = nullIfBlank(parsed.data.jobTitle);
  const billingEmail = parsed.data.billingEmail.toLowerCase().trim();
  const billingAddress = parsed.data.billingAddress.trim();

  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: companyName,
        billingEmail,
        billingAddress,
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
        billingAddress,
        billingPhone: normalizeMyPhone(parsed.data.phone) ?? null,
      },
    });

    return created;
  });

  return NextResponse.json({ company: publicCompany(company) }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await requireCustomer();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          'Company name, billing email, and billing address are required.',
      },
      { status: 400 }
    );
  }

  const me = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: { id: true, companyId: true, companyRole: true },
  });
  if (!me?.companyId) {
    return NextResponse.json(
      { error: 'Register a company first.' },
      { status: 404 }
    );
  }
  if (me.companyRole !== 'OWNER') {
    return NextResponse.json(
      { error: 'Only the company owner can change billing details.' },
      { status: 403 }
    );
  }

  const companyName = parsed.data.name.trim();
  const clash = await prisma.company.findFirst({
    where: {
      name: { equals: companyName, mode: 'insensitive' },
      NOT: { id: me.companyId },
    },
  });
  if (clash) {
    return NextResponse.json(
      { error: 'A company with that name already exists.' },
      { status: 409 }
    );
  }

  const billingEmail = parsed.data.billingEmail.toLowerCase().trim();
  const billingAddress = parsed.data.billingAddress.trim();
  const phone = normalizeMyPhone(parsed.data.phone) ?? null;

  const company = await prisma.$transaction(async (tx) => {
    const updated = await tx.company.update({
      where: { id: me.companyId! },
      data: {
        name: companyName,
        billingEmail,
        billingAddress,
        phone,
      },
    });
    await tx.customer.update({
      where: { id: me.id },
      data: {
        billingEmail,
        billingAddress,
        billingPhone: phone,
      },
    });
    return updated;
  });

  return NextResponse.json({ company: publicCompany(company) });
}
