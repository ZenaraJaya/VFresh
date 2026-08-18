import { ymdFromValue } from '@/lib/miri-date';

export const DELIVERY_SLA_MS = 60 * 60 * 1000;
/** Kitchen + rider need this much notice before the booked receive time. */
export const MIN_DELIVERY_LEAD_MS = 90 * 60 * 1000;
export const MIN_DELIVERY_LEAD_MINUTES = 90;
export const DELAY_REASON_MIN = 10;
const MAX_PROOF_LENGTH = 400_000;

export type DeliveryClockOrder = {
  status: string;
  deliveryDate: Date | string;
  deliveryTime?: string | null;
  pickedUpAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  delayReason?: string | null;
  delayProof?: string | null;
  updatedAt?: Date | string | null;
};

function asDate(value?: Date | string | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeHm(raw?: string | null) {
  const s = String(raw ?? '').trim();
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function windowEndHm(raw?: string | null) {
  const times = String(raw ?? '').match(/\d{1,2}:\d{2}/g) ?? [];
  if (times.length === 0) return null;
  return normalizeHm(times[times.length - 1]);
}

/** Booked receive time in Asia/Kuching (UTC+8). Uses the end of a time window. */
export function promisedReceiveAt(
  deliveryDate: Date | string,
  deliveryTime?: string | null
) {
  const ymd = ymdFromValue(deliveryDate);
  const hm = windowEndHm(deliveryTime) ?? '12:00';
  return new Date(`${ymd}T${hm}:00+08:00`);
}

export function earliestDeliveryAt(from = new Date()) {
  return new Date(from.getTime() + MIN_DELIVERY_LEAD_MS);
}

export function isDeliveryTooSoon(
  deliveryDate: Date | string,
  deliveryTime?: string | null,
  now = new Date()
) {
  return (
    promisedReceiveAt(deliveryDate, deliveryTime).getTime() <
    earliestDeliveryAt(now).getTime()
  );
}

export function clockStartAt(order: DeliveryClockOrder) {
  const picked = asDate(order.pickedUpAt);
  if (picked) return picked;
  if (String(order.status).toUpperCase() === 'OUT_FOR_DELIVERY') {
    return asDate(order.updatedAt) ?? promisedReceiveAt(order.deliveryDate, order.deliveryTime);
  }
  return promisedReceiveAt(order.deliveryDate, order.deliveryTime);
}

export function slaDueAt(order: DeliveryClockOrder) {
  return new Date(clockStartAt(order).getTime() + DELIVERY_SLA_MS);
}

export function isOpenDelivery(status: string) {
  const s = String(status).toUpperCase();
  return s !== 'DELIVERED' && s !== 'CANCELLED';
}

export function isDeliveryLate(order: DeliveryClockOrder, now = new Date()) {
  const due = slaDueAt(order).getTime();
  if (isOpenDelivery(order.status)) return now.getTime() > due;
  const done = asDate(order.deliveredAt);
  if (String(order.status).toUpperCase() === 'DELIVERED' && done) {
    return done.getTime() > due;
  }
  return false;
}

export function remainingMs(order: DeliveryClockOrder, now = new Date()) {
  if (!isOpenDelivery(order.status)) return 0;
  return slaDueAt(order).getTime() - now.getTime();
}

export function formatDuration(ms: number) {
  const abs = Math.abs(ms);
  const mins = Math.floor(abs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function delayProofOk(raw: unknown): { error: string } | { value: string } {
  if (raw === null || raw === undefined || raw === '') {
    return { error: 'Add a photo as proof of the delay.' };
  }
  const value = String(raw).trim();
  if (value.length > MAX_PROOF_LENGTH) {
    return { error: 'Proof photo is too large. Use a smaller picture.' };
  }
  if (value.startsWith('data:image/')) {
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) {
      return { error: 'Proof must be a PNG, JPEG, WebP, or GIF.' };
    }
    return { value };
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { error: 'Proof link must start with http or https.' };
    }
    return { value };
  } catch {
    return { error: 'Add a photo as proof of the delay.' };
  }
}

export function delayReasonOk(raw: unknown): { error: string } | { value: string } {
  const value = String(raw ?? '').trim();
  if (value.length < DELAY_REASON_MIN) {
    return {
      error: `Explain the delay in at least ${DELAY_REASON_MIN} characters.`,
    };
  }
  if (value.length > 1000) {
    return { error: 'Keep the delay reason under 1000 characters.' };
  }
  return { value };
}

export function requireDelayIfLate(
  order: DeliveryClockOrder,
  extras: { delayReason?: unknown; delayProof?: unknown },
  now = new Date()
) {
  const lateNow = now.getTime() > slaDueAt(order).getTime();
  if (!lateNow) {
    return { delayReason: null as string | null, delayProof: null as string | null };
  }

  const reason = delayReasonOk(extras.delayReason);
  if ('error' in reason) return { error: reason.error };
  const proof = delayProofOk(extras.delayProof);
  if ('error' in proof) return { error: proof.error };
  return { delayReason: reason.value, delayProof: proof.value };
}

export function deliveryTrackPayload(order: DeliveryClockOrder, now = new Date()) {
  const start = clockStartAt(order);
  const due = slaDueAt(order);
  const late = isDeliveryLate(order, now);
  const open = isOpenDelivery(order.status);
  const left = remainingMs(order, now);
  return {
    promisedAt: promisedReceiveAt(order.deliveryDate, order.deliveryTime).toISOString(),
    pickedUpAt: asDate(order.pickedUpAt)?.toISOString() ?? null,
    deliveredAt: asDate(order.deliveredAt)?.toISOString() ?? null,
    clockStartedAt: start.toISOString(),
    dueAt: due.toISOString(),
    late,
    remainingMs: open ? left : 0,
    slaMinutes: 60,
    delayReason: order.delayReason ?? null,
    delayProof: order.delayProof ?? null,
  };
}

export function riderAwaitingReply(order: {
  riderNotifiedAt?: Date | string | null;
  riderAckAt?: Date | string | null;
}) {
  const notified = order.riderNotifiedAt
    ? new Date(order.riderNotifiedAt).getTime()
    : 0;
  if (!notified) return false;
  const ack = order.riderAckAt ? new Date(order.riderAckAt).getTime() : 0;
  return ack < notified;
}
