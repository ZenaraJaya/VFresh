import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { isValidPassword } from '@/lib/password-rules';
import { normalizeMyPhone } from '@/lib/phone';
import { emailAlreadyUsed } from '@/lib/email-taken';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  password: z.string().min(1),
  phone: z.string().max(40).optional().or(z.literal('')),
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
    const phone = normalizeMyPhone(parsed.data.phone ?? '') ?? null;

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    if (await emailAlreadyUsed(email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const courier = await prisma.courier.create({
      data: {
        name,
        email,
        phone,
        password: await bcrypt.hash(password, 10),
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(courier, { status: 201 });
  } catch (error) {
    console.error('POST /api/courier/register', error);
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}
