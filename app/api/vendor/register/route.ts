import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { generateTempPassword } from '@/lib/password';
import { normalizeMyPhone } from '@/lib/phone';
import { emailAlreadyUsed } from '@/lib/email-taken';
import { adminAppealEmail } from '@/lib/admin-contact';
import type { PremisesType } from '@prisma/client';

const PREMISES: PremisesType[] = ['HOMEBASED', 'OTHER'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '')
      .toLowerCase()
      .trim();
    const businessName = String(body.businessName ?? '').trim();
    const phone = normalizeMyPhone(String(body.phone ?? '')) ?? '';
    const description = String(body.description ?? '').trim();
    const address = String(body.address ?? '').trim();
    const registrationNumber = body.registrationNumber
      ? String(body.registrationNumber).trim()
      : null;
    const premisesType = String(body.premisesType ?? '').toUpperCase() as PremisesType;

    if (!email || !businessName || !phone || !description || !address) {
      return NextResponse.json(
        {
          error:
            'Business name, email, phone, address, and short description are required.',
        },
        { status: 400 }
      );
    }

    if (!PREMISES.includes(premisesType)) {
      return NextResponse.json(
        { error: 'Select premises type: homebased or other.' },
        { status: 400 }
      );
    }

    const existingVendor = await prisma.vendor.findUnique({
      where: { email },
      select: { status: true, registrationNumber: true },
    });
    if (existingVendor?.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          error: `This kitchen is suspended and cannot register again. Email ${adminAppealEmail()} to appeal.`,
        },
        { status: 403 }
      );
    }

    const regNo = registrationNumber?.trim();
    if (regNo) {
      const sameReg = await prisma.vendor.findFirst({
        where: { registrationNumber: regNo, status: 'SUSPENDED' },
        select: { id: true },
      });
      if (sameReg) {
        return NextResponse.json(
          {
            error: `This kitchen is suspended and cannot register again. Email ${adminAppealEmail()} to appeal.`,
          },
          { status: 403 }
        );
      }
    }

    if (await emailAlreadyUsed(email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    let slug = slugify(businessName) || 'vendor';
    const clash = await prisma.vendor.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    // Placeholder until admin approves and emails a real temporary password.
    const placeholder = await bcrypt.hash(`pending:${generateTempPassword(24)}`, 10);

    const vendor = await prisma.vendor.create({
      data: {
        email,
        password: placeholder,
        businessName,
        slug,
        phone,
        description,
        address,
        registrationNumber,
        premisesType,
        status: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        businessName: true,
        slug: true,
        status: true,
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    console.error('vendor register', error);
    return NextResponse.json(
      { error: 'Could not create vendor account.' },
      { status: 500 }
    );
  }
}
