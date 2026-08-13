import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parsePackQty } from '@/lib/daily-pack';

async function requireOwnedItem(id: string) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const existing = await prisma.menuItem.findFirst({
    where: { id, vendorId: session.user.id },
  });
  if (!existing) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }

  return { session, existing };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireOwnedItem(id);
  if ('error' in gate && gate.error) return gate.error;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined)
    data.description = String(body.description).trim();
  if (body.category !== undefined) data.category = String(body.category).trim();
  if (body.image !== undefined) data.image = String(body.image).trim();
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.badges !== undefined) data.badges = body.badges;
  if (body.available !== undefined) data.available = Boolean(body.available);
  try {
    if (body.dailyPackQty !== undefined) {
      data.dailyPackQty = parsePackQty(body.dailyPackQty);
      if (body.remainingQty === undefined && data.dailyPackQty !== undefined) {
        data.remainingQty = data.dailyPackQty;
      }
    }
    if (body.remainingQty !== undefined) {
      data.remainingQty = parsePackQty(body.remainingQty);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid quantity' },
      { status: 400 }
    );
  }

  const item = await prisma.menuItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireOwnedItem(id);
  if ('error' in gate && gate.error) return gate.error;

  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
