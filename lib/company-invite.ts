import { randomBytes } from 'crypto';
import { isCompanyUsable } from '@/lib/company';
import type { CompanyInvite } from '@prisma/client';
import { prisma } from '@/lib/db';

export function newInviteToken() {
  return randomBytes(24).toString('base64url');
}

export function inviteIsActive(
  invite: Pick<CompanyInvite, 'revokedAt' | 'expiresAt'>
) {
  if (invite.revokedAt) return false;
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export async function findActiveInvite(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const invite = await prisma.companyInvite.findUnique({
    where: { token: trimmed },
    include: {
      company: { select: { id: true, name: true, isActive: true, status: true } },
    },
  });

  if (!invite || !inviteIsActive(invite) || !isCompanyUsable(invite.company)) {
    return null;
  }

  return invite;
}

export async function requireCompanyOwner(customerId: string) {
  const me = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      companyId: true,
      companyRole: true,
      company: { select: { id: true, name: true, isActive: true, status: true } },
    },
  });

  if (
    !me?.companyId ||
    !me.company ||
    me.companyRole !== 'OWNER' ||
    !isCompanyUsable(me.company)
  ) {
    return null;
  }

  return me;
}
