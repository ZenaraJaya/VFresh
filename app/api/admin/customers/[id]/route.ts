import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { emailAlreadyUsed } from '@/lib/email-taken';
import { isValidPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-rules';

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.email().optional(),
  password: z.string().optional(),
  jobTitle: z.string().max(80).optional().or(z.literal('')),
  companyRole: z.enum(['OWNER', 'STAFF']).optional(),
});

const staffSelect = {
  id: true,
  name: true,
  email: true,
  jobTitle: true,
  companyRole: true,
  companyId: true,
  createdAt: true,
} as const;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, companyId: true, companyRole: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const p = parsed.data;
  if (p.password && !isValidPassword(p.password)) {
    return NextResponse.json(
      {
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  if (p.email) {
    const email = p.email.toLowerCase().trim();
    const taken = await emailAlreadyUsed(email);
    const same = await prisma.customer.findUnique({
      where: { email },
      select: { id: true },
    });
    if (taken && same?.id !== id) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }
  }

  if (
    p.companyRole === 'STAFF' &&
    existing.companyRole === 'OWNER' &&
    existing.companyId
  ) {
    const owners = await prisma.customer.count({
      where: { companyId: existing.companyId, companyRole: 'OWNER' },
    });
    if (owners <= 1) {
      return NextResponse.json(
        { error: 'Keep at least one owner on the company.' },
        { status: 400 }
      );
    }
  }

  const user = await prisma.customer.update({
    where: { id },
    data: {
      name: p.name?.trim(),
      email: p.email?.toLowerCase().trim(),
      jobTitle:
        p.jobTitle === undefined ? undefined : p.jobTitle.trim() || null,
      companyRole: p.companyRole,
      password: p.password
        ? await bcrypt.hash(p.password, 10)
        : undefined,
    },
    select: staffSelect,
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, companyId: true, companyRole: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.companyRole === 'OWNER' && existing.companyId) {
    const owners = await prisma.customer.count({
      where: { companyId: existing.companyId, companyRole: 'OWNER' },
    });
    if (owners <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last owner. Add another owner first.' },
        { status: 400 }
      );
    }
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
