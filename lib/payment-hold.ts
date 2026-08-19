import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import {
  PAYMENT_HOLD_EXPIRED,
  PAYMENT_HOLD_MS,
  paymentHoldCustomerMessage,
} from '@/lib/payment-hold-copy';

export {
  PAYMENT_HOLD_EXPIRED,
  PAYMENT_HOLD_MS,
  paymentHoldCustomerMessage,
};

export function paymentHoldCutoff(now = new Date()) {
  return new Date(now.getTime() - PAYMENT_HOLD_MS);
}

/** Open orders that still occupy leftover packs. */
export function activeStockHoldWhere(now = new Date()): Prisma.OrderWhereInput {
  const cutoff = paymentHoldCutoff(now);
  return {
    status: { not: 'CANCELLED' },
    stockDeducted: false,
    OR: [
      { paymentMethod: 'COMPANY_ACCOUNT' },
      { paymentStatus: 'PAID' },
      {
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'PENDING',
        createdAt: { gte: cutoff },
      },
    ],
  };
}

export function unpaidCardHoldExpiredWhere(
  now = new Date()
): Prisma.OrderWhereInput {
  return {
    status: { not: 'CANCELLED' },
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: 'PENDING',
    paidAt: null,
    createdAt: { lt: paymentHoldCutoff(now) },
  };
}

function holdEmail(orderNumber: string, name?: string | null) {
  const who = name?.trim() || 'there';
  const body = paymentHoldCustomerMessage(orderNumber);
  return {
    subject: `VFresh: order ${orderNumber} was released`,
    text: `Hi ${who},\n\n${body}\n\n— VFresh`,
    html: `<div style="font-family:sans-serif;line-height:1.5;color:#111">
      <p>Hi ${who},</p>
      <p>${body}</p>
      <p>— VFresh</p>
    </div>`,
  };
}

/** Cancel unpaid card orders past the 1-hour hold so leftover packs go back on sale. */
export async function releaseExpiredPaymentHolds(now = new Date()) {
  const expired = await prisma.order.findMany({
    where: unpaidCardHoldExpiredWhere(now),
    select: {
      id: true,
      orderNumber: true,
      employeeEmail: true,
      employeeName: true,
      customer: { select: { email: true, name: true } },
    },
  });
  if (expired.length === 0) return { released: 0 };

  await prisma.order.updateMany({
    where: { id: { in: expired.map((o) => o.id) } },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'FAILED',
      cancelReason: PAYMENT_HOLD_EXPIRED,
    },
  });

  await Promise.all(
    expired.map(async (order) => {
      const to = order.employeeEmail || order.customer?.email;
      if (!to) return;
      const mail = holdEmail(
        order.orderNumber,
        order.employeeName || order.customer?.name
      );
      try {
        await sendEmail({ to, ...mail });
      } catch (err) {
        console.error('payment hold email', order.orderNumber, err);
      }
    })
  );

  return { released: expired.length };
}
