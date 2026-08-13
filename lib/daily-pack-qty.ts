export function parsePackQty(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Daily pack quantity must be a whole number of 0 or more.');
  }
  return n;
}

export function sellableQty(
  remainingQty: number | null | undefined,
  reserved: number
): number | null {
  if (remainingQty == null) return null;
  return Math.max(0, remainingQty - reserved);
}

export function maxCartQty(remainingQty: number | null | undefined) {
  if (remainingQty == null) return 500;
  return Math.max(0, remainingQty);
}
