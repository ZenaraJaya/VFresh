import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isValidPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-rules';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (!isValidPassword(newPassword)) {
    return NextResponse.json(
      {
        error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
  });
  if (!customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ok = await bcrypt.compare(currentPassword, customer.password);
  if (!ok) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 400 }
    );
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}
