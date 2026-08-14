import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  inviteIsActive,
  newInviteToken,
  requireCompanyOwner,
} from '@/lib/company-invite';

async function ownerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER') return null;
  return requireCompanyOwner(session.user.id);
}

export async function GET() {
  const owner = await ownerSession();
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invites = await prisma.companyInvite.findMany({
    where: { companyId: owner.companyId!, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const active = invites.find(inviteIsActive) ?? null;

  return NextResponse.json({
    companyName: owner.company!.name,
    invite: active
      ? { token: active.token, createdAt: active.createdAt }
      : null,
  });
}

export async function POST() {
  const owner = await ownerSession();
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = newInviteToken();

  const invite = await prisma.$transaction(async (tx) => {
    await tx.companyInvite.updateMany({
      where: { companyId: owner.companyId!, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return tx.companyInvite.create({
      data: {
        token,
        companyId: owner.companyId!,
        createdById: owner.id,
      },
    });
  });

  return NextResponse.json(
    { token: invite.token, createdAt: invite.createdAt },
    { status: 201 }
  );
}

export async function DELETE() {
  const owner = await ownerSession();
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.companyInvite.updateMany({
    where: { companyId: owner.companyId!, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
