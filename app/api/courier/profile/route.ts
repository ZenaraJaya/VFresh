import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { findCourierById } from '@/lib/courier-lookup';
import { normalizeMyPhone } from '@/lib/phone';

const patchSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().or(z.literal('')),
});

async function riderSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'DELIVERY') return null;
  return session;
}

function publicCourier(row: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
}) {
  return { id: row.id, email: row.email, name: row.name, phone: row.phone };
}

export async function GET() {
  const session = await riderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const me = await findCourierById(session.user.id);
  if (!me) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(publicCourier(me));
}

export async function PATCH(req: Request) {
  const session = await riderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const phone = normalizeMyPhone(parsed.data.phone ?? '') ?? null;

  try {
    const me = await prisma.courier.update({
      where: { id: session.user.id },
      data: { name, phone },
      select: { id: true, email: true, name: true, phone: true },
    });

    await prisma.order.updateMany({
      where: {
        courierId: session.user.id,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      data: { courierName: name },
    });

    return NextResponse.json(publicCourier(me));
  } catch (error) {
    console.error('PATCH /api/courier/profile', error);
    return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
  }
}
