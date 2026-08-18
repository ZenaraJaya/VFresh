import { prisma } from '@/lib/db';
import { deliveryTrackPayload, riderAwaitingReply } from '@/lib/delivery-sla';

export type DeliveryOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  stockDeducted: boolean;
  deliveryLocation: string;
  deliveryDate: Date;
  deliveryTime: string | null;
  employeeName: string;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  delayReason: string | null;
  delayProof: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  proofTakenAt: Date | null;
  proofLat: number | null;
  proofLng: number | null;
  riderNotifiedAt: Date | null;
  riderNotifyNote: string | null;
  riderAckAt: Date | null;
  courierId: string | null;
  courierName: string | null;
  updatedAt: Date;
  vendor: { businessName: string } | null;
  company: { name: string } | null;
  items: { quantity: number; menuItem: { name: string } }[];
};

type RawOrder = {
  id: string;
  orderNumber: string;
  status: string;
  stockDeducted: boolean | number;
  deliveryLocation: string;
  deliveryDate: Date;
  deliveryTime: string | null;
  employeeName: string;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  delayReason: string | null;
  delayProof: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  proofTakenAt: Date | null;
  proofLat: number | null;
  proofLng: number | null;
  riderNotifiedAt: Date | null;
  riderNotifyNote: string | null;
  riderAckAt: Date | null;
  courierId: string | null;
  courierName: string | null;
  updatedAt: Date;
  vendorName: string | null;
  companyName: string | null;
};

function asOrder(row: RawOrder, items: DeliveryOrderRow['items']): DeliveryOrderRow {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    stockDeducted: Boolean(row.stockDeducted),
    deliveryLocation: row.deliveryLocation,
    deliveryDate: row.deliveryDate,
    deliveryTime: row.deliveryTime,
    employeeName: row.employeeName,
    pickedUpAt: row.pickedUpAt,
    deliveredAt: row.deliveredAt,
    delayReason: row.delayReason,
    delayProof: row.delayProof,
    deliveryLat: row.deliveryLat == null ? null : Number(row.deliveryLat),
    deliveryLng: row.deliveryLng == null ? null : Number(row.deliveryLng),
    proofTakenAt: row.proofTakenAt,
    proofLat: row.proofLat == null ? null : Number(row.proofLat),
    proofLng: row.proofLng == null ? null : Number(row.proofLng),
    riderNotifiedAt: row.riderNotifiedAt,
    riderNotifyNote: row.riderNotifyNote,
    riderAckAt: row.riderAckAt,
    courierId: row.courierId,
    courierName: row.courierName,
    updatedAt: row.updatedAt,
    vendor: row.vendorName ? { businessName: row.vendorName } : null,
    company: row.companyName ? { name: row.companyName } : null,
    items,
  };
}

export function deliveryOrderJson(order: DeliveryOrderRow) {
  return {
    ...order,
    track: deliveryTrackPayload(order),
    kitchenPing: riderAwaitingReply(order)
      ? {
          note: order.riderNotifyNote?.trim() || 'Kitchen is waiting for a reply.',
          at: order.riderNotifiedAt ?? null,
        }
      : null,
  };
}

export async function ackDeliveryOrder(orderId: string) {
  await prisma.$executeRaw`
    UPDATE orders SET "riderAckAt" = NOW(), "updatedAt" = NOW() WHERE id = ${orderId}
  `;
}

async function loadItems(orderIds: string[]) {
  const byId = new Map<string, DeliveryOrderRow['items']>();
  if (orderIds.length === 0) return byId;

  const rows = await prisma.$queryRaw<{ orderId: string; quantity: number; name: string }[]>`
    SELECT oi."orderId", oi.quantity, m.name
    FROM order_items oi
    JOIN menu_items m ON m.id = oi."menuItemId"
    WHERE oi."orderId" = ANY(${orderIds})
  `;

  for (const row of rows) {
    const list = byId.get(row.orderId) ?? [];
    list.push({ quantity: Number(row.quantity), menuItem: { name: row.name } });
    byId.set(row.orderId, list);
  }
  return byId;
}

async function attachItems(rows: RawOrder[]) {
  const items = await loadItems(rows.map((row) => row.id));
  return rows.map((row) => asOrder(row, items.get(row.id) ?? []));
}

export async function getDeliveryOrderByNumber(orderNumber: string) {
  const rows = await prisma.$queryRaw<RawOrder[]>`
    SELECT
      o.id, o."orderNumber", o.status, o."stockDeducted", o."deliveryLocation",
      o."deliveryDate", o."deliveryTime", o."employeeName",
      o."pickedUpAt", o."deliveredAt", o."delayReason", o."delayProof",
      o."deliveryLat", o."deliveryLng", o."proofTakenAt", o."proofLat", o."proofLng",
      o."riderNotifiedAt", o."riderNotifyNote", o."riderAckAt",
      o."courierId", o."courierName", o."updatedAt",
      v."businessName" AS "vendorName",
      c.name AS "companyName"
    FROM orders o
    LEFT JOIN vendors v ON v.id = o."vendorId"
    LEFT JOIN companies c ON c.id = o."companyId"
    WHERE o."orderNumber" = ${orderNumber}
    LIMIT 1
  `;
  const [order] = await attachItems(rows);
  return order ?? null;
}

export async function getDeliveryOrderById(id: string) {
  const rows = await prisma.$queryRaw<RawOrder[]>`
    SELECT
      o.id, o."orderNumber", o.status, o."stockDeducted", o."deliveryLocation",
      o."deliveryDate", o."deliveryTime", o."employeeName",
      o."pickedUpAt", o."deliveredAt", o."delayReason", o."delayProof",
      o."deliveryLat", o."deliveryLng", o."proofTakenAt", o."proofLat", o."proofLng",
      o."riderNotifiedAt", o."riderNotifyNote", o."riderAckAt",
      o."courierId", o."courierName", o."updatedAt",
      v."businessName" AS "vendorName",
      c.name AS "companyName"
    FROM orders o
    LEFT JOIN vendors v ON v.id = o."vendorId"
    LEFT JOIN companies c ON c.id = o."companyId"
    WHERE o.id = ${id}
    LIMIT 1
  `;
  const [order] = await attachItems(rows);
  return order ?? null;
}

export async function listOpenDeliveryRuns(courierId: string) {
  const rows = await prisma.$queryRaw<RawOrder[]>`
    SELECT
      o.id, o."orderNumber", o.status, o."stockDeducted", o."deliveryLocation",
      o."deliveryDate", o."deliveryTime", o."employeeName",
      o."pickedUpAt", o."deliveredAt", o."delayReason", o."delayProof",
      o."deliveryLat", o."deliveryLng", o."proofTakenAt", o."proofLat", o."proofLng",
      o."riderNotifiedAt", o."riderNotifyNote", o."riderAckAt",
      o."courierId", o."courierName", o."updatedAt",
      v."businessName" AS "vendorName",
      c.name AS "companyName"
    FROM orders o
    LEFT JOIN vendors v ON v.id = o."vendorId"
    LEFT JOIN companies c ON c.id = o."companyId"
    WHERE (
      o.status = 'READY'
      AND (o."courierId" IS NULL OR o."courierId" = ${courierId})
    )
       OR (
         o."courierId" = ${courierId}
         AND o.status IN ('HEADING_TO_VENDOR', 'OUT_FOR_DELIVERY', 'READY', 'PREPARING', 'CONFIRMED')
       )
    ORDER BY o."deliveryDate" ASC, o."updatedAt" DESC
    LIMIT 80
  `;
  return attachItems(rows);
}

export async function listDeliveryInbox(courierId: string) {
  const rows = await prisma.$queryRaw<RawOrder[]>`
    SELECT
      o.id, o."orderNumber", o.status, o."stockDeducted", o."deliveryLocation",
      o."deliveryDate", o."deliveryTime", o."employeeName",
      o."pickedUpAt", o."deliveredAt", o."delayReason", o."delayProof",
      o."deliveryLat", o."deliveryLng", o."proofTakenAt", o."proofLat", o."proofLng",
      o."riderNotifiedAt", o."riderNotifyNote", o."riderAckAt",
      o."courierId", o."courierName", o."updatedAt",
      v."businessName" AS "vendorName",
      c.name AS "companyName"
    FROM orders o
    LEFT JOIN vendors v ON v.id = o."vendorId"
    LEFT JOIN companies c ON c.id = o."companyId"
    WHERE o.status NOT IN ('DELIVERED', 'CANCELLED')
      AND (o."courierId" = ${courierId} OR (o."courierId" IS NULL AND o."riderNotifiedAt" IS NOT NULL))
    ORDER BY o."updatedAt" DESC
    LIMIT 40
  `;
  return attachItems(rows);
}

export async function claimDeliveryOrder(
  orderId: string,
  rider: { id: string; name?: string | null },
  opts?: { ack?: boolean }
) {
  const rows = await prisma.$queryRaw<{ courierId: string | null; courierName: string | null }[]>`
    SELECT "courierId", "courierName" FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  const order = rows[0];
  if (!order) throw new Error('Order not found');
  if (order.courierId && order.courierId !== rider.id) {
    throw new Error(`This order is with ${order.courierName || 'another rider'}`);
  }
  if (!order.courierId) {
    const name = (rider.name || '').trim() || 'Rider';
    await prisma.$executeRaw`
      UPDATE orders
      SET "courierId" = ${rider.id}, "courierName" = ${name}, "updatedAt" = NOW()
      WHERE id = ${orderId}
    `;
  }
  if (opts?.ack) {
    await prisma.$executeRaw`
      UPDATE orders SET "riderAckAt" = NOW(), "updatedAt" = NOW() WHERE id = ${orderId}
    `;
  }
}

export async function headingToVendor(
  orderId: string,
  rider: { id: string; name?: string | null }
) {
  const name = (rider.name || '').trim() || 'Rider';
  const taken = await prisma.$queryRaw<{ courierId: string | null; courierName: string | null; status: string }[]>`
    SELECT "courierId", "courierName", status FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  const order = taken[0];
  if (!order) throw new Error('Order not found');
  if (order.courierId && order.courierId !== rider.id) {
    throw new Error(`This order is with ${order.courierName || 'another rider'}`);
  }
  if (!['READY', 'PREPARING', 'CONFIRMED', 'HEADING_TO_VENDOR'].includes(order.status)) {
    throw new Error('This order is not ready to collect yet');
  }

  await prisma.$executeRaw`
    UPDATE orders
    SET status = 'HEADING_TO_VENDOR',
        "courierId" = ${rider.id},
        "courierName" = ${name},
        "updatedAt" = NOW()
    WHERE id = ${orderId}
      AND ("courierId" IS NULL OR "courierId" = ${rider.id})
      AND status IN ('READY', 'PREPARING', 'CONFIRMED', 'HEADING_TO_VENDOR')
  `;
}

export async function markPickedUp(
  orderId: string,
  rider: { id: string; name?: string | null }
) {
  await claimDeliveryOrder(orderId, rider);
  const updated = await prisma.$executeRaw`
    UPDATE orders
    SET status = 'OUT_FOR_DELIVERY',
        "pickedUpAt" = COALESCE("pickedUpAt", NOW()),
        "updatedAt" = NOW()
    WHERE id = ${orderId}
      AND "courierId" = ${rider.id}
      AND status IN ('HEADING_TO_VENDOR', 'READY', 'OUT_FOR_DELIVERY')
  `;
  if (Number(updated) === 0) {
    throw new Error('Tap On the way to the restaurant first so this run is yours');
  }
}
