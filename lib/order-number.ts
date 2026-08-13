import { randomBytes } from 'node:crypto';

/** Kitchen-facing order id. Also set in the DB trigger when present. */
export function newOrderNumber() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${ymd}-${suffix}`;
}
