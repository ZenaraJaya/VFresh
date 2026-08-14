import { prisma } from '@/lib/db';
import { requireCustomer } from '@/lib/auth-guard';
import { ORDER_STATUS_LABEL } from '@/lib/order-status';
import type { OrderStatus, Prisma } from '@prisma/client';

export const ORDER_LABEL: Record<string, string> = {
  ...ORDER_STATUS_LABEL,
  PENDING: 'Receive',
};

export const INVOICE_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'HEADING_TO_VENDOR',
  'OUT_FOR_DELIVERY',
];

export function ymd(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function customerOrderWhere(
  customerId: string,
  email: string,
  companyId?: string | null
): Prisma.OrderWhereInput {
  return {
    OR: [
      { customerId },
      ...(email
        ? [{ employeeEmail: { equals: email, mode: 'insensitive' as const } }]
        : []),
      ...(companyId ? [{ companyId }] : []),
    ],
  };
}

export function customerScheduleWhere(
  customerId: string,
  email: string,
  companyId?: string | null
): Prisma.RecurringOrderWhereInput {
  return {
    active: true,
    OR: [
      { customerId },
      ...(email
        ? [{ employeeEmail: { equals: email, mode: 'insensitive' as const } }]
        : []),
      ...(companyId ? [{ companyId }] : []),
    ],
  };
}

const orderInclude = {
  vendor: { select: { businessName: true } },
  items: { include: { menuItem: { select: { name: true } } } },
} satisfies Prisma.OrderInclude;

export async function loadCustomerAccount(callbackUrl: string) {
  const session = await requireCustomer(callbackUrl);
  const email = session.user.email ?? '';

  const me = await prisma.customer.findUnique({
    where: { id: session.user.id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          billingEmail: true,
          billingAddress: true,
          phone: true,
          isActive: true,
          status: true,
          reviewNote: true,
        },
      },
    },
  });

  const companyId = me?.companyId ?? session.user.companyId;

  return { session, me, email, companyId };
}

export { orderInclude };
