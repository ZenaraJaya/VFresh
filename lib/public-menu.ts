import { Prisma } from '@prisma/client';
import { prisma, prismaHasMenuReviewStatus } from '@/lib/db';
import { VENDOR_HOURS_SELECT } from '@/lib/vendor-availability';

/** Storefront dishes: in stock and not rejected by admin review. */
export const STOREFRONT_ITEM_WHERE = {
  available: true,
  reviewStatus: 'LIVE' as const,
};

/** Safe for Prisma select/_count even if the running client is stale. */
export function storefrontItemWhereSync() {
  if (prismaHasMenuReviewStatus()) {
    return STOREFRONT_ITEM_WHERE;
  }
  return { available: true as const };
}

export async function rejectedMenuIdSet() {
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM menu_items WHERE "reviewStatus"::text = 'REJECTED'
    `);
    return new Set(rows.map((row) => row.id));
  } catch (error) {
    console.error('menu reviewStatus column', error);
    return new Set<string>();
  }
}

export async function isMenuRejected(id: string) {
  try {
    const rows = await prisma.$queryRaw<{ status: string | null }[]>(Prisma.sql`
      SELECT "reviewStatus"::text AS status
      FROM menu_items
      WHERE id = ${id}
      LIMIT 1
    `);
    return rows[0]?.status === 'REJECTED';
  } catch (error) {
    console.error('menu reviewStatus lookup', error);
    return false;
  }
}

/** Prisma `where` for live storefront items. Avoids Unknown argument reviewStatus. */
export async function storefrontWhere(
  extra: Prisma.MenuItemWhereInput = {}
): Promise<Prisma.MenuItemWhereInput> {
  const parts: Prisma.MenuItemWhereInput[] = [{ available: true }, extra];
  if (prismaHasMenuReviewStatus()) {
    parts.push({ reviewStatus: 'LIVE' });
  } else {
    const rejected = [...(await rejectedMenuIdSet())];
    if (rejected.length) parts.push({ id: { notIn: rejected } });
  }
  return { AND: parts };
}

export const VENDOR_PUBLIC_SELECT = {
  id: true,
  businessName: true,
  slug: true,
  description: true,
  logo: true,
  phone: true,
  address: true,
  ...VENDOR_HOURS_SELECT,
  _count: { select: { menuItems: { where: storefrontItemWhereSync() } } },
} as const;
