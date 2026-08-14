import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { isValidPassword } from '@/lib/password-rules';
import { findActiveInvite } from '@/lib/company-invite';
import { emailAlreadyUsed } from '@/lib/email-taken';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  password: z.string().min(1),
  jobTitle: z.string().max(80).optional().or(z.literal('')),
  inviteToken: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
});

function nullIfBlank(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;
    const jobTitle = nullIfBlank(parsed.data.jobTitle);

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    if (parsed.data.inviteToken && parsed.data.companyId) {
      return NextResponse.json(
        { error: 'Use a staff link or pick a company, not both.' },
        { status: 400 }
      );
    }

    if (await emailAlreadyUsed(email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (parsed.data.inviteToken) {
      const invite = await findActiveInvite(parsed.data.inviteToken);
      if (!invite) {
        return NextResponse.json(
          { error: 'This staff link is invalid or has been revoked.' },
          { status: 400 }
        );
      }

      const created = await prisma.customer.create({
        data: {
          name,
          email,
          password: passwordHash,
          jobTitle,
          companyId: invite.companyId,
          companyRole: 'STAFF',
          paymentMethod: 'COMPANY_ACCOUNT',
        },
        select: { id: true, email: true, name: true },
      });

      return NextResponse.json({ customer: created }, { status: 201 });
    }

    if (parsed.data.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: parsed.data.companyId, ...USABLE_COMPANY_WHERE },
      });
      if (!company) {
        return NextResponse.json(
          { error: 'Select an approved company, or register one from your profile.' },
          { status: 400 }
        );
      }

      const ownerExists = await prisma.customer.findFirst({
        where: { companyId: company.id, companyRole: 'OWNER' },
        select: { id: true },
      });

      const created = await prisma.customer.create({
        data: {
          name,
          email,
          password: passwordHash,
          jobTitle,
          companyId: company.id,
          companyRole: ownerExists ? 'STAFF' : 'OWNER',
          paymentMethod: 'CREDIT_CARD',
        },
        select: { id: true, email: true, name: true },
      });

      return NextResponse.json({ customer: created }, { status: 201 });
    }

    const created = await prisma.customer.create({
      data: {
        name,
        email,
        password: passwordHash,
        jobTitle,
        paymentMethod: 'CREDIT_CARD',
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ customer: created }, { status: 201 });
  } catch (error) {
    console.error('customer register', error);
    return NextResponse.json(
      { error: 'Could not create account.' },
      { status: 500 }
    );
  }
}
