import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MIN_PASSWORD_LENGTH } from '@/lib/password-rules';

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.admin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data: {
    email?: string;
    name?: string | null;
    password?: string;
  } = {};

  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (email !== existing.email) {
      const clash =
        (await prisma.admin.findUnique({ where: { email } })) ||
        (await prisma.vendor.findUnique({ where: { email } })) ||
        (await prisma.customer.findUnique({ where: { email } }));
      if (clash) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        );
      }
    }
    data.email = email;
  }

  if (body.name !== undefined) {
    data.name = body.name ? String(body.name).trim() : null;
  }

  if (body.password) {
    const password = String(body.password);
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }
    data.password = await bcrypt.hash(password, 10);
  }

  const admin = await prisma.admin.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(admin);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account.' },
      { status: 400 }
    );
  }

  const count = await prisma.admin.count();
  if (count <= 1) {
    return NextResponse.json(
      { error: 'Cannot delete the last admin.' },
      { status: 400 }
    );
  }

  await prisma.admin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
