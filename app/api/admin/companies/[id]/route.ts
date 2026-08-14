import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import type { CompanyStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const patchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isActive: z.boolean().optional(),
  reviewNote: z.string().max(500).optional().or(z.literal('')),
});

type RouteContext = { params: Promise<{ id: string }> };

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  }

  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const status = parsed.data.status as CompanyStatus | undefined;
  const isActive =
    parsed.data.isActive !== undefined
      ? parsed.data.isActive
      : status === 'APPROVED'
        ? true
        : status === 'REJECTED' || status === 'PENDING'
          ? false
          : undefined;

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...(status ? { status, reviewedAt: new Date() } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(parsed.data.reviewNote !== undefined
        ? { reviewNote: parsed.data.reviewNote.trim() || null }
        : {}),
    },
  });

  return NextResponse.json(company);
}
