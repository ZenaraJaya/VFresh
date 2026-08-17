import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const VENDOR_LIST_SELECT = {
  id: true,
  email: true,
  businessName: true,
  slug: true,
  phone: true,
  address: true,
  description: true,
  registrationNumber: true,
  premisesType: true,
  status: true,
  createdAt: true,
  _count: { select: { menuItems: true } },
} as const;

type WarningRow = {
  id: string;
  warningCount: number;
  lastWarningAt: Date | null;
  lastWarningReason: string | null;
  warningHistory: unknown;
  suspendReason: string | null;
  suspendedAt: Date | null;
};

export async function vendorWarningMap() {
  try {
    const rows = await prisma.$queryRaw<WarningRow[]>(Prisma.sql`
      SELECT
        id,
        COALESCE("warningCount", 0)::int AS "warningCount",
        "lastWarningAt",
        "lastWarningReason",
        "warningHistory",
        "suspendReason",
        "suspendedAt"
      FROM vendors
    `);
    return new Map(rows.map((row) => [row.id, row]));
  } catch (error) {
    console.error('vendor warning columns', error);
    return new Map<string, WarningRow>();
  }
}

export async function vendorWarningById(id: string) {
  const map = await vendorWarningMap();
  return (
    map.get(id) ?? {
      id,
      warningCount: 0,
      lastWarningAt: null,
      lastWarningReason: null,
      warningHistory: [],
      suspendReason: null,
      suspendedAt: null,
    }
  );
}

type ReviewRow = {
  id: string;
  reviewStatus: string | null;
  rejectReason: string | null;
};

export async function menuReviewMap(vendorId: string) {
  try {
    const rows = await prisma.$queryRaw<ReviewRow[]>(Prisma.sql`
      SELECT id, "reviewStatus"::text AS "reviewStatus", "rejectReason"
      FROM menu_items
      WHERE "vendorId" = ${vendorId}
    `);
    return new Map(rows.map((row) => [row.id, row]));
  } catch (error) {
    console.error('menu review columns', error);
    return new Map<string, ReviewRow>();
  }
}

export function withWarnings<T extends { id: string }>(
  vendor: T,
  extras: WarningRow | undefined
) {
  return {
    ...vendor,
    warningCount: extras?.warningCount ?? 0,
    lastWarningAt: extras?.lastWarningAt ?? null,
    lastWarningReason: extras?.lastWarningReason ?? null,
    warningHistory: extras?.warningHistory ?? [],
    suspendReason: extras?.suspendReason ?? null,
    suspendedAt: extras?.suspendedAt ?? null,
  };
}
