import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { emailAlreadyUsed } from '@/lib/email-taken';
import { isValidPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-rules';

type RouteContext = { params: Promise<{ id: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  password: z.string().min(1),
  jobTitle: z.string().max(80).optional().or(z.literal('')),
  companyRole: z.enum(['OWNER', 'STAFF']).default('STAFF'),
});

const staffSelect = {
  id: true,
  name: true,
  email: true,
  jobTitle: true,
  companyRole: true,
  createdAt: true,
} as const;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function POST(req: Request, { params }: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: companyId } = await params;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Name, email, and password are required.' },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  if (!isValidPassword(parsed.data.password)) {
    return NextResponse.json(
      {
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  if (await emailAlreadyUsed(email)) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    );
  }

  const jobTitle = parsed.data.jobTitle?.trim() || null;
  const user = await prisma.customer.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      password: await bcrypt.hash(parsed.data.password, 10),
      jobTitle,
      companyId,
      companyRole: parsed.data.companyRole,
      paymentMethod: 'COMPANY_ACCOUNT',
    },
    select: staffSelect,
  });

  return NextResponse.json(user, { status: 201 });
}
