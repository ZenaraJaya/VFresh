import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sellableQty } from '@/lib/daily-pack-qty';

const OPEN_ORDER = {
  status: { not: 'CANCELLED' as const },
  stockDeducted: false,
};

export async function reservedQtyByMenuItem(menuItemIds: string[]) {
  const reserved = new Map<string, number>();
  if (menuItemIds.length === 0) return reserved;

  const rows = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      menuItemId: { in: menuItemIds },
      order: OPEN_ORDER,
    },
    _sum: { quantity: true },
  });

  for (const row of rows) {
    reserved.set(row.menuItemId, row._sum.quantity ?? 0);
  }
  return reserved;
}

export async function withPublicPackQty<
  T extends { id: string; remainingQty: number | null },
>(items: T[]): Promise<(T & { remainingQty: number | null })[]> {
  const reserved = await reservedQtyByMenuItem(items.map((i) => i.id));
  return items.map((item) => ({
    ...item,
    remainingQty: sellableQty(item.remainingQty, reserved.get(item.id) ?? 0),
  }));
}

export async function assertSellableForCheckout(
  lines: { menuItemId: string; quantity: number }[]
) {
  const wanted = new Map<string, number>();
  for (const line of lines) {
    wanted.set(line.menuItemId, (wanted.get(line.menuItemId) ?? 0) + line.quantity);
  }
  const ids = [...wanted.keys()];
  const [items, reserved] = await Promise.all([
    prisma.menuItem.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, remainingQty: true },
    }),
    reservedQtyByMenuItem(ids),
  ]);

  for (const item of items) {
    const left = sellableQty(item.remainingQty, reserved.get(item.id) ?? 0);
    if (left == null) continue;
    const need = wanted.get(item.id) ?? 0;
    if (need > left) {
      throw new Error(
        left === 0
          ? `${item.name} is sold out for today`
          : `Only ${left} left of ${item.name} today`
      );
    }
  }
}

type Tx = Prisma.TransactionClient;

async function deductLines(tx: Tx, items: { menuItemId: string; quantity: number }[]) {
  for (const line of items) {
    const item = await tx.menuItem.findUnique({
      where: { id: line.menuItemId },
      select: { remainingQty: true },
    });
    if (item?.remainingQty == null) continue;
    await tx.menuItem.update({
      where: { id: line.menuItemId },
      data: { remainingQty: Math.max(0, item.remainingQty - line.quantity) },
    });
  }
}

async function restoreLines(tx: Tx, items: { menuItemId: string; quantity: number }[]) {
  for (const line of items) {
    const item = await tx.menuItem.findUnique({
      where: { id: line.menuItemId },
      select: { remainingQty: true },
    });
    if (item?.remainingQty == null) continue;
    await tx.menuItem.update({
      where: { id: line.menuItemId },
      data: { remainingQty: item.remainingQty + line.quantity },
    });
  }
}

/** Customer or vendor Receive: leftover packs go down, order marked delivered. */
export async function markOrderReceived(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status === 'CANCELLED') {
      throw new Error('This order was cancelled');
    }

    if (order.stockDeducted) {
      if (order.status !== 'DELIVERED') {
        return tx.order.update({
          where: { id: orderId },
          data: { status: 'DELIVERED' },
          include: {
            company: { select: { id: true, name: true } },
            items: { include: { menuItem: true } },
          },
        });
      }
      return order;
    }

    await deductLines(tx, order.items);
    return tx.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED', stockDeducted: true },
      include: {
        company: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });
  });
}

export async function applyOrderStatusStock(
  orderId: string,
  nextStatus: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
) {
  if (nextStatus === 'DELIVERED') {
    return markOrderReceived(orderId);
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error('Order not found');

    if (nextStatus === 'CANCELLED' && order.stockDeducted) {
      await restoreLines(tx, order.items);
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', stockDeducted: false },
        include: {
          company: { select: { id: true, name: true } },
          items: { include: { menuItem: true } },
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
      include: {
        company: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });
  });
}
