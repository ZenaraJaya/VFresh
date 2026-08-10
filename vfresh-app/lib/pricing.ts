/**
 * Single source of truth for order maths.
 *
 * The cart uses these to preview totals; POST /api/orders recomputes with the
 * same functions from database prices, so a tampered client payload can't
 * change what gets billed.
 */

/** Malaysian SST on prepared food. */
export const TAX_RATE = 0.06;
export const DELIVERY_FEE = 5;
/** Corporate orders above this ship free. */
export const FREE_DELIVERY_THRESHOLD = 100;

/** Round to sen — floats accumulate error across many line items. */
export function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateTotals(subtotalRaw: number) {
  const subtotal = toMoney(subtotalRaw);
  const tax = toMoney(subtotal * TAX_RATE);
  const deliveryFee =
    subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  return {
    subtotal,
    tax,
    deliveryFee,
    total: toMoney(subtotal + tax + deliveryFee),
  };
}

export function formatMYR(value: number): string {
  return `RM ${value.toFixed(2)}`;
}
