import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { miriYmd } from '@/lib/miri-date';
import { formatMYR, toMoney } from '@/lib/pricing';
import { companyInvoiceEmail, sendEmail } from '@/lib/email';

export type InvoicePeriod = 'current' | 'previous';

/** First instant of a Malaysia calendar month, and the first instant of the next. */
export function malaysiaMonthBounds(ref = new Date(), offsetMonths = 0) {
  const ymd = miriYmd(ref);
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const absolute = year * 12 + (month - 1) + offsetMonths;
  const startYear = Math.floor(absolute / 12);
  const startMonth = (absolute % 12) + 1;
  const endAbsolute = absolute + 1;
  const endYear = Math.floor(endAbsolute / 12);
  const endMonth = (endAbsolute % 12) + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  const periodStart = new Date(
    `${startYear}-${pad(startMonth)}-01T00:00:00+08:00`
  );
  const periodEnd = new Date(`${endYear}-${pad(endMonth)}-01T00:00:00+08:00`);
  return { periodStart, periodEnd };
}

export function newInvoiceNumber(at = new Date()) {
  const ymd = miriYmd(at);
  const ym = ymd.slice(0, 7).replace('-', '');
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `INV-${ym}-${suffix}`;
}

function dueDateFromPeriodEnd(periodEnd: Date) {
  const due = new Date(periodEnd);
  due.setUTCDate(due.getUTCDate() + 30);
  return due;
}

export async function unbilledCompanyOrders(opts: {
  period: InvoicePeriod;
  companyId?: string;
}) {
  const { periodStart, periodEnd } = malaysiaMonthBounds(
    new Date(),
    opts.period === 'previous' ? -1 : 0
  );

  const orders = await prisma.order.findMany({
    where: {
      invoiceId: null,
      paymentMethod: 'COMPANY_ACCOUNT',
      status: { not: 'CANCELLED' },
      createdAt: { gte: periodStart, lt: periodEnd },
      ...(opts.companyId ? { companyId: opts.companyId } : {}),
    },
    select: {
      id: true,
      companyId: true,
      total: true,
      orderNumber: true,
      createdAt: true,
      employeeName: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return { periodStart, periodEnd, orders };
}

export async function previewCompanyInvoices(opts: {
  period: InvoicePeriod;
  companyId?: string;
}) {
  const { periodStart, periodEnd, orders } = await unbilledCompanyOrders(opts);
  const due = dueDateFromPeriodEnd(periodEnd);
  const companyIds = [...new Set(orders.map((order) => order.companyId))];
  const companies = companyIds.length
    ? await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true, billingEmail: true },
      })
    : [];
  const companyById = new Map(companies.map((row) => [row.id, row]));

  const drafts = companyIds.map((companyId) => {
    const lines = orders.filter((order) => order.companyId === companyId);
    const company = companyById.get(companyId);
    return {
      companyId,
      name: company?.name ?? companyId,
      billingEmail: company?.billingEmail ?? '',
      orderCount: lines.length,
      totalAmount: toMoney(lines.reduce((sum, line) => sum + line.total, 0)),
      orders: lines.map((line) => ({
        id: line.id,
        orderNumber: line.orderNumber,
        employeeName: line.employeeName,
        total: line.total,
        createdAt: line.createdAt.toISOString(),
      })),
    };
  });

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    dueDate: due.toISOString(),
    periodLabel: periodStart.toLocaleDateString('en-MY', {
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kuching',
    }),
    drafts,
  };
}

export async function issueCompanyInvoices(opts: {
  period: InvoicePeriod;
  companyId?: string;
  sendMail?: boolean;
  orderIds?: string[];
}) {
  const { periodStart, periodEnd } = malaysiaMonthBounds(
    new Date(),
    opts.period === 'previous' ? -1 : 0
  );

  const orders = await prisma.order.findMany({
    where: {
      invoiceId: null,
      paymentMethod: 'COMPANY_ACCOUNT',
      status: { not: 'CANCELLED' },
      createdAt: { gte: periodStart, lt: periodEnd },
      ...(opts.companyId ? { companyId: opts.companyId } : {}),
      ...(opts.orderIds?.length ? { id: { in: opts.orderIds } } : {}),
    },
    select: { id: true, companyId: true, total: true },
  });

  const byCompany = new Map<string, { ids: string[]; total: number }>();
  for (const order of orders) {
    const row = byCompany.get(order.companyId) ?? { ids: [], total: 0 };
    row.ids.push(order.id);
    row.total = toMoney(row.total + order.total);
    byCompany.set(order.companyId, row);
  }

  const created: {
    id: string;
    invoiceNumber: string;
    companyId: string;
    totalAmount: number;
    emailed: boolean;
  }[] = [];
  const errors: string[] = [];

  for (const [companyId, group] of byCompany) {
    if (group.ids.length === 0) continue;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, billingEmail: true },
    });
    if (!company) continue;

    const invoiceNumber = newInvoiceNumber();
    const asSent = opts.sendMail === true;
    try {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          companyId,
          periodStart,
          periodEnd,
          totalAmount: group.total,
          status: asSent ? 'SENT' : 'DRAFT',
          dueDate: dueDateFromPeriodEnd(periodEnd),
        },
      });
      await prisma.order.updateMany({
        where: { id: { in: group.ids }, invoiceId: null },
        data: { invoiceId: invoice.id },
      });

      let emailed = false;
      if (asSent && company.billingEmail) {
        const mail = companyInvoiceEmail({
          companyName: company.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: formatMYR(invoice.totalAmount),
          orderCount: group.ids.length,
          dueYmd: invoice.dueDate.toISOString().slice(0, 10),
          periodLabel: periodStart.toLocaleDateString('en-MY', {
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Kuching',
          }),
        });
        try {
          const sent = await sendEmail({
            to: company.billingEmail,
            ...mail,
          });
          emailed = Boolean(sent.ok);
        } catch (error) {
          console.error('Invoice email failed', error);
        }
      }

      created.push({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        companyId,
        totalAmount: invoice.totalAmount,
        emailed,
      });
    } catch (error) {
      console.error('Invoice create failed', companyId, error);
      errors.push(
        error instanceof Error ? error.message : 'Could not create invoice'
      );
    }
  }

  return {
    periodStart,
    periodEnd,
    created: created.length,
    invoices: created,
    errors,
  };
}

export function isMalaysiaMonthStart(now = new Date()) {
  return miriYmd(now).endsWith('-01');
}

const invoiceInclude = {
  company: {
    select: {
      id: true,
      name: true,
      billingEmail: true,
      billingAddress: true,
      phone: true,
    },
  },
  orders: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      orderNumber: true,
      employeeName: true,
      total: true,
      status: true,
      createdAt: true,
      deliveryDate: true,
    },
  },
};

function sumBillable(orders: { total: number; status: string }[]) {
  return toMoney(
    orders
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.total, 0)
  );
}

export async function loadAdminInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: invoiceInclude,
  });
  if (!invoice) return null;

  const available = await prisma.order.findMany({
    where: {
      companyId: invoice.companyId,
      invoiceId: null,
      paymentMethod: 'COMPANY_ACCOUNT',
      status: { not: 'CANCELLED' },
      createdAt: { gte: invoice.periodStart, lt: invoice.periodEnd },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      employeeName: true,
      total: true,
      status: true,
      createdAt: true,
      deliveryDate: true,
    },
  });

  return {
    ...invoice,
    calculatedTotal: sumBillable(invoice.orders),
    available,
  };
}

async function refreshInvoiceTotal(id: string) {
  const orders = await prisma.order.findMany({
    where: { invoiceId: id },
    select: { total: true, status: true },
  });
  return prisma.invoice.update({
    where: { id },
    data: { totalAmount: sumBillable(orders) },
    include: invoiceInclude,
  });
}

/** Drop cancelled lines, pull in new unbilled month orders, recalc the total. */
export async function syncInvoiceWithMonth(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return null;

  await prisma.order.updateMany({
    where: { invoiceId: id, status: 'CANCELLED' },
    data: { invoiceId: null },
  });

  await prisma.order.updateMany({
    where: {
      companyId: invoice.companyId,
      invoiceId: null,
      paymentMethod: 'COMPANY_ACCOUNT',
      status: { not: 'CANCELLED' },
      createdAt: { gte: invoice.periodStart, lt: invoice.periodEnd },
    },
    data: { invoiceId: id },
  });

  await refreshInvoiceTotal(id);
  return loadAdminInvoice(id);
}

export async function setInvoiceOrder(
  invoiceId: string,
  orderId: string,
  attach: boolean
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      companyId: true,
      invoiceId: true,
      paymentMethod: true,
      status: true,
    },
  });
  if (!order || order.companyId !== invoice.companyId) {
    throw new Error('Order does not belong to this company');
  }
  if (order.paymentMethod !== 'COMPANY_ACCOUNT') {
    throw new Error('Only company-account orders can go on an invoice');
  }

  if (attach) {
    if (order.invoiceId && order.invoiceId !== invoiceId) {
      throw new Error('That order is already on another invoice');
    }
    if (order.status === 'CANCELLED') {
      throw new Error('Cancelled orders cannot be billed');
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { invoiceId },
    });
  } else {
    await prisma.order.update({
      where: { id: orderId, invoiceId },
      data: { invoiceId: null },
    });
  }

  await refreshInvoiceTotal(invoiceId);
  return loadAdminInvoice(invoiceId);
}

export async function updateInvoiceMeta(
  id: string,
  data: {
    dueDate?: Date;
    periodStart?: Date;
    periodEnd?: Date;
    status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  }
) {
  await prisma.invoice.update({
    where: { id },
    data,
  });
  return loadAdminInvoice(id);
}

function addCalendarDay(ymd: string, days: number) {
  const [year, month, day] = ymd.slice(0, 10).split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

export async function saveInvoicePreview(
  id: string,
  input: {
    invoiceNumber?: string;
    dueDate?: string;
    periodStart?: string;
    periodEnd?: string;
    periodEndInclusive?: string;
    companyName?: string;
    billingEmail?: string;
    billingAddress?: string;
    phone?: string;
  }
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, companyId: true, status: true },
  });
  if (!invoice) return null;
  if (invoice.status === 'CANCELLED') {
    throw new Error('Cancelled invoices cannot be edited');
  }

  const ymd = (value?: string) =>
    value ? new Date(`${value.slice(0, 10)}T00:00:00+08:00`) : undefined;

  const invoiceNumber = input.invoiceNumber?.trim();
  if (invoiceNumber) {
    const clash = await prisma.invoice.findFirst({
      where: { invoiceNumber, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      throw new Error('That invoice number is already in use');
    }
  }

  const exclusiveEnd = input.periodEndInclusive
    ? ymd(addCalendarDay(input.periodEndInclusive, 1))
    : ymd(input.periodEnd);

  await prisma.invoice.update({
    where: { id },
    data: {
      invoiceNumber: invoiceNumber || undefined,
      dueDate: ymd(input.dueDate),
      periodStart: ymd(input.periodStart),
      periodEnd: exclusiveEnd,
    },
  });

  const billingEmail = input.billingEmail?.trim().toLowerCase();
  if (billingEmail !== undefined && !billingEmail) {
    throw new Error('Billing email is required');
  }

  await prisma.company.update({
    where: { id: invoice.companyId },
    data: {
      name: input.companyName?.trim() || undefined,
      billingEmail: billingEmail || undefined,
      billingAddress:
        input.billingAddress === undefined
          ? undefined
          : input.billingAddress.trim() || null,
      phone: input.phone === undefined ? undefined : input.phone.trim() || null,
    },
  });

  await refreshInvoiceTotal(id);
  return loadAdminInvoice(id);
}

export async function sendInvoice(id: string) {
  const invoice = await loadAdminInvoice(id);
  if (!invoice) return null;
  if (invoice.status === 'CANCELLED') {
    throw new Error('Cancelled invoices cannot be sent');
  }
  if (invoice.status === 'PAID') {
    throw new Error('Paid invoices cannot be sent again');
  }

  const billable = invoice.orders.filter((row) => row.status !== 'CANCELLED');
  if (billable.length === 0) {
    throw new Error('Add at least one order before sending');
  }

  const to = invoice.company.billingEmail?.trim();
  if (!to) {
    throw new Error('Add a billing email before sending');
  }

  const periodLabel = invoice.periodStart.toLocaleDateString('en-MY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuching',
  });
  const mail = companyInvoiceEmail({
    companyName: invoice.company.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: formatMYR(invoice.totalAmount),
    orderCount: billable.length,
    dueYmd: invoice.dueDate.toISOString().slice(0, 10),
    periodLabel,
  });
  let emailed = false;
  const sent = await sendEmail({ to, ...mail });
  emailed = Boolean(sent.ok);

  await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT' },
  });

  return { ...(await loadAdminInvoice(id)), emailed };
}

export async function cancelInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!invoice) return null;
  if (invoice.status === 'PAID') {
    throw new Error('Paid invoices cannot be cancelled');
  }
  if (invoice.status === 'CANCELLED') {
    return loadAdminInvoice(id);
  }

  await prisma.order.updateMany({
    where: { invoiceId: id },
    data: { invoiceId: null },
  });
  await prisma.invoice.update({
    where: { id },
    data: { status: 'CANCELLED', totalAmount: 0 },
  });
  return loadAdminInvoice(id);
}
