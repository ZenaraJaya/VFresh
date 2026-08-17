import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { Prisma, type VendorStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateTempPassword } from '@/lib/password';
import {
  sendEmail,
  vendorApprovalEmail,
  vendorSuspendEmail,
  vendorWarningEmail,
} from '@/lib/email';
import { adminAppealEmail, appBaseUrl } from '@/lib/admin-contact';
import {
  menuReviewMap,
  vendorWarningById,
  withWarnings,
} from '@/lib/vendor-moderation-db';

const ALLOWED: VendorStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
];

const CORE_SELECT = {
  id: true,
  email: true,
  businessName: true,
  slug: true,
  phone: true,
  address: true,
  description: true,
  registrationNumber: true,
  premisesType: true,
  status: true,
  createdAt: true,
  menuItems: {
    orderBy: { updatedAt: 'desc' as const },
  },
};

async function vendorDetail(id: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    select: CORE_SELECT,
  });
  if (!vendor) return null;

  const [extras, reviews] = await Promise.all([
    vendorWarningById(id),
    menuReviewMap(id),
  ]);

  return withWarnings(
    {
      ...vendor,
      menuItems: vendor.menuItems.map((item) => ({
        ...item,
        reviewStatus: reviews.get(item.id)?.reviewStatus ?? 'LIVE',
        rejectReason: reviews.get(item.id)?.rejectReason ?? null,
      })),
    },
    extras
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const vendor = await vendorDetail(id);
  if (!vendor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(vendor);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const action = typeof body.action === 'string' ? body.action : '';
  const reason = String(body.reason ?? '').trim();
  const status = body.status as VendorStatus | undefined;

  const existing = await prisma.vendor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const extras = await vendorWarningById(id);

  if (action === 'warn') {
    if (!reason) {
      return NextResponse.json(
        { error: 'Give a reason for the warning.' },
        { status: 400 }
      );
    }
    if (existing.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Warnings apply to approved vendors.' },
        { status: 400 }
      );
    }
    if (extras.warningCount >= 2) {
      return NextResponse.json(
        { error: 'Two warnings already issued. Suspend if there is no improvement.' },
        { status: 400 }
      );
    }

    const history = Array.isArray(extras.warningHistory)
      ? [...(extras.warningHistory as { at: string; reason: string }[])]
      : [];
    const warningNumber = extras.warningCount + 1;
    history.push({ at: new Date().toISOString(), reason });

    await prisma.$executeRaw(Prisma.sql`
      UPDATE vendors
      SET
        "warningCount" = ${warningNumber},
        "lastWarningAt" = NOW(),
        "lastWarningReason" = ${reason},
        "warningHistory" = ${JSON.stringify(history)}::jsonb
      WHERE id = ${id}
    `);

    const vendor = await vendorDetail(id);
    const mail = vendorWarningEmail({
      businessName: existing.businessName,
      warningNumber,
      reason,
      remainingBeforeSuspend: 2 - warningNumber,
    });
    const result = await sendEmail({
      to: existing.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return NextResponse.json({ ...vendor, emailSent: result.ok });
  }

  if (action === 'suspend') {
    if (!reason) {
      return NextResponse.json(
        { error: 'Give a reason for the suspension.' },
        { status: 400 }
      );
    }
    if (extras.warningCount < 2) {
      return NextResponse.json(
        { error: 'Issue two warnings first, then suspend if there is no improvement.' },
        { status: 400 }
      );
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE vendors
      SET
        status = CAST('SUSPENDED' AS "VendorStatus"),
        "suspendReason" = ${reason},
        "suspendedAt" = NOW(),
        "isOpen" = false
      WHERE id = ${id}
    `);

    const vendor = await vendorDetail(id);
    const mail = vendorSuspendEmail({
      businessName: existing.businessName,
      reason,
      appealEmail: adminAppealEmail(),
    });
    const result = await sendEmail({
      to: existing.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return NextResponse.json({ ...vendor, emailSent: result.ok });
  }

  if (!status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  let tempPassword: string | undefined;
  const data: { status: VendorStatus; password?: string } = { status };

  if (status === 'APPROVED' && existing.status !== 'APPROVED') {
    tempPassword = generateTempPassword();
    data.password = await bcrypt.hash(tempPassword, 10);
  }

  await prisma.vendor.update({
    where: { id },
    data,
  });

  if (status === 'APPROVED') {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE vendors
      SET "suspendReason" = NULL, "suspendedAt" = NULL
      WHERE id = ${id}
    `).catch(() => undefined);
  }

  const vendor = await vendorDetail(id);

  let emailSent = false;
  if (tempPassword && vendor) {
    const mail = vendorApprovalEmail({
      businessName: vendor.businessName,
      email: vendor.email,
      tempPassword,
      loginUrl: `${appBaseUrl()}/login`,
    });
    const result = await sendEmail({
      to: vendor.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    emailSent = result.ok;
  }

  return NextResponse.json({
    ...vendor,
    emailSent,
    tempPassword: tempPassword ?? null,
  });
}
