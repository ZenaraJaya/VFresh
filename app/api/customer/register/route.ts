import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { isValidPassword } from '@/lib/password-rules';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  password: z.string().min(1),
  companyId: z.string().min(1),
});

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

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const company = await prisma.company.findFirst({
      where: { id: parsed.data.companyId, isActive: true },
    });
    if (!company) {
      return NextResponse.json(
        { error: 'Select your company account.' },
        { status: 400 }
      );
    }

    const [admin, vendor, customer] = await Promise.all([
      prisma.admin.findUnique({ where: { email } }),
      prisma.vendor.findUnique({ where: { email } }),
      prisma.customer.findUnique({ where: { email } }),
    ]);

    if (admin || vendor || customer) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const created = await prisma.customer.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        companyId: company.id,
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
