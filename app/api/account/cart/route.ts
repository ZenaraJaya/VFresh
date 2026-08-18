import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  entriesFromLines,
  hydrateSavedCart,
  mergeSavedCart,
  parseSavedCart,
  type SavedCartEntry,
} from '@/lib/saved-cart';

async function customerId() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'CUSTOMER' || !session.user.id) {
    return null;
  }
  return session.user.id;
}

async function readSaved(id: string): Promise<SavedCartEntry[]> {
  const me = await prisma.customer.findUnique({
    where: { id },
    select: { cart: true },
  });
  return parseSavedCart(me?.cart);
}

async function writeSaved(id: string, entries: SavedCartEntry[]) {
  await prisma.customer.update({
    where: { id },
    data: { cart: entries as Prisma.InputJsonValue },
  });
}

export async function GET() {
  const id = await customerId();
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const lines = await hydrateSavedCart(await readSaved(id));
    return NextResponse.json({ lines });
  } catch (error) {
    console.error('Load saved cart failed', error);
    return NextResponse.json({ error: 'Could not load cart' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const id = await customerId();
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { lines?: unknown };
    const entries = parseSavedCart(body.lines);
    const lines = await hydrateSavedCart(entries);
    await writeSaved(id, entriesFromLines(lines));
    return NextResponse.json({ lines });
  } catch (error) {
    console.error('Save cart failed', error);
    return NextResponse.json({ error: 'Could not save cart' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const id = await customerId();
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { lines?: unknown };
    const guest = parseSavedCart(body.lines);
    const merged = mergeSavedCart(await readSaved(id), guest);
    const lines = await hydrateSavedCart(merged);
    await writeSaved(id, entriesFromLines(lines));
    return NextResponse.json({ lines });
  } catch (error) {
    console.error('Merge cart failed', error);
    return NextResponse.json({ error: 'Could not save cart' }, { status: 500 });
  }
}
