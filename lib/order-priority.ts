import { ymdFromValue } from '@/lib/miri-date';

export function deliveryTimeMinutes(value?: string | null) {
  if (!value) return 24 * 60;
  const m = /(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return 24 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function compareDeliveryPriority(
  a: { deliveryDate: string | Date; deliveryTime?: string | null; createdAt?: string | Date },
  b: { deliveryDate: string | Date; deliveryTime?: string | null; createdAt?: string | Date }
) {
  const da = ymdFromValue(a.deliveryDate);
  const db = ymdFromValue(b.deliveryDate);
  if (da !== db) return da < db ? -1 : 1;
  const ta = deliveryTimeMinutes(a.deliveryTime);
  const tb = deliveryTimeMinutes(b.deliveryTime);
  if (ta !== tb) return ta - tb;
  const ca = new Date(a.createdAt ?? 0).getTime();
  const cb = new Date(b.createdAt ?? 0).getTime();
  return ca - cb;
}

export function deliveryDayLabel(value: string | Date, todayYmd: string) {
  const ymd = ymdFromValue(value);
  if (ymd <= todayYmd) {
    return ymd < todayYmd ? 'Overdue' : 'Today';
  }
  const t = new Date(`${todayYmd}T00:00:00.000Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  const tom = t.toISOString().slice(0, 10);
  if (ymd === tom) return 'Tomorrow';
  return new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
