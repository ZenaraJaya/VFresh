import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireVendorSession() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireVendorSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await prisma.menuItem.findMany({
    where: { vendorId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      badges: Array.isArray(item.badges) ? item.badges : [],
    }))
  );
}

export async function POST(req: Request) {
  const session = await requireVendorSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const category = String(body.category ?? '').trim();
  const image = String(body.image ?? '').trim();
  const price = Number(body.price);
  const badges = Array.isArray(body.badges) ? body.badges : [];
  const available = body.available !== false;

  if (!name || !description || !category || !image || Number.isNaN(price)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: {
      name,
      description,
      category,
      image,
      price,
      badges,
      available,
      vendorId: session.user.id,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
