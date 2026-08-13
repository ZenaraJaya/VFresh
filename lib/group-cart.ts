import { calculateTotals } from '@/lib/pricing';
import type { CartLine } from '@/types';

export type VendorCartGroup = {
  vendorId: string;
  vendorName: string;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
};

export function vendorIdOf(item: {
  vendorId?: string | null;
  vendor?: { id?: string } | null;
}) {
  return item.vendorId ?? item.vendor?.id ?? null;
}

export function vendorNameOf(item: {
  vendor?: { businessName?: string } | null;
}) {
  return item.vendor?.businessName?.trim() || 'Kitchen';
}

/** One checkout creates one order ID per kitchen. */
export function groupCartByVendor(lines: CartLine[]): VendorCartGroup[] {
  const map = new Map<string, VendorCartGroup>();

  for (const line of lines) {
    const vendorId = vendorIdOf(line.menuItem) ?? 'unknown';
    const existing = map.get(vendorId);
    if (existing) {
      existing.lines.push(line);
      continue;
    }
    map.set(vendorId, {
      vendorId,
      vendorName: vendorNameOf(line.menuItem),
      lines: [line],
      subtotal: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
    });
  }

  return [...map.values()].map((group) => {
    const raw = group.lines.reduce(
      (sum, l) => sum + l.menuItem.price * l.quantity,
      0
    );
    const totals = calculateTotals(raw);
    return { ...group, ...totals };
  });
}
