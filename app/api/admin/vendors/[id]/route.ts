import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateTempPassword } from '@/lib/password';
import { sendEmail, vendorApprovalEmail } from '@/lib/email';
import type { VendorStatus } from '@prisma/client';

const ALLOWED: VendorStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
];

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
  const status = body.status as VendorStatus;

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await prisma.vendor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let tempPassword: string | undefined;
  const data: { status: VendorStatus; password?: string } = { status };

  // On first approval (or re-approval), issue a temporary password and email it.
  if (status === 'APPROVED' && existing.status !== 'APPROVED') {
    tempPassword = generateTempPassword();
    data.password = await bcrypt.hash(tempPassword, 10);
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      businessName: true,
      status: true,
      phone: true,
      address: true,
      registrationNumber: true,
      premisesType: true,
      description: true,
    },
  });

  let emailSent = false;
  if (tempPassword) {
    const base =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const mail = vendorApprovalEmail({
      businessName: vendor.businessName,
      email: vendor.email,
      tempPassword,
      loginUrl: `${base.replace(/\/$/, '')}/login`,
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
    // Only returned to the approving admin so they can share if email failed.
    tempPassword: tempPassword ?? null,
  });
}
