import { prisma } from '@/lib/db';
import { withPublicPackQty } from '@/lib/daily-pack';
import { maxCartQty } from '@/lib/daily-pack-qty';
import { VENDOR_HOURS_SELECT } from '@/lib/vendor-availability';
import type { CartLine } from '@/types';

export type SavedCartEntry = {
  menuItemId: string;
  quantity: number;
  notes?: string;
};

export function parseSavedCart(value: unknown): SavedCartEntry[] {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, SavedCartEntry>();
  for (const row of value) {
    const parsed = parseEntry(row);
    if (!parsed) continue;
    const existing = byId.get(parsed.menuItemId);
    if (existing) {
      byId.set(parsed.menuItemId, {
        menuItemId: parsed.menuItemId,
        quantity: existing.quantity + parsed.quantity,
        notes: parsed.notes || existing.notes,
      });
    } else {
      byId.set(parsed.menuItemId, parsed);
    }
  }
  return [...byId.values()];
}

function parseEntry(row: unknown): SavedCartEntry | null {
  if (!row || typeof row !== 'object') return null;
  const raw = row as Record<string, unknown>;
  const menuItemId =
    typeof raw.menuItemId === 'string'
      ? raw.menuItemId
      : nestedMenuItemId(raw.menuItem);
  const quantity = Number(raw.quantity);
  if (!menuItemId || !Number.isFinite(quantity) || quantity <= 0) return null;
  const notes =
    typeof raw.notes === 'string' && raw.notes.trim()
      ? raw.notes.trim()
      : undefined;
  return {
    menuItemId,
    quantity: Math.min(500, Math.floor(quantity)),
    notes,
  };
}

function nestedMenuItemId(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const id = (value as { id?: unknown }).id;
  return typeof id === 'string' ? id : '';
}

export function mergeSavedCart(
  saved: SavedCartEntry[],
  guest: SavedCartEntry[]
): SavedCartEntry[] {
  const byId = new Map<string, SavedCartEntry>();
  for (const entry of saved) byId.set(entry.menuItemId, { ...entry });
  for (const entry of guest) {
    const existing = byId.get(entry.menuItemId);
    if (!existing) {
      byId.set(entry.menuItemId, { ...entry });
      continue;
    }
    byId.set(entry.menuItemId, {
      menuItemId: entry.menuItemId,
      quantity: existing.quantity + entry.quantity,
      notes: entry.notes || existing.notes,
    });
  }
  return [...byId.values()];
}

export async function hydrateSavedCart(
  entries: SavedCartEntry[]
): Promise<CartLine[]> {
  if (entries.length === 0) return [];
  const items = await prisma.menuItem.findMany({
    where: { id: { in: entries.map((entry) => entry.menuItemId) } },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          ...VENDOR_HOURS_SELECT,
        },
      },
    },
  });
  const live = await withPublicPackQty(items);
  const byId = new Map(live.map((item) => [item.id, item]));
  const lines: CartLine[] = [];
  for (const entry of entries) {
    const menuItem = byId.get(entry.menuItemId);
    if (!menuItem || !menuItem.available) continue;
    const max = maxCartQty(menuItem.remainingQty);
    if (max <= 0) continue;
    lines.push({
      menuItem: menuItem as CartLine['menuItem'],
      quantity: Math.min(max, entry.quantity),
      notes: entry.notes,
    });
  }
  return lines;
}

export function entriesFromLines(lines: CartLine[]): SavedCartEntry[] {
  return parseSavedCart(
    lines.map((line) => ({
      menuItemId: line.menuItem.id,
      quantity: line.quantity,
      notes: line.notes,
    }))
  );
}
