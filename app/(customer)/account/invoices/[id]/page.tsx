import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import {
  INVOICE_LABEL,
  ORDER_LABEL,
  loadCustomerAccount,
  ymd,
} from '@/lib/customer-account';
import {
  PageIntro,
  SectionCard,
  StatusBadge,
  invoiceTone,
  orderTone,
} from '@/components/customer/account/ui';

export const dynamic = 'force-dynamic';

export default async function AccountInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId } = await loadCustomerAccount(`/account/invoices/${id}`);

  if (!companyId) notFound();

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId, status: { in: ['SENT', 'PAID', 'OVERDUE'] } },
    include: {
      company: {
        select: {
          name: true,
          billingEmail: true,
          billingAddress: true,
          phone: true,
        },
      },
      orders: {
        orderBy: { deliveryDate: 'asc' },
        include: {
          vendor: { select: { businessName: true } },
          customer: { select: { name: true, email: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      },
    },
  });

  if (!invoice) notFound();

  return (
    <>
      <p className="mb-3 text-sm">
        <Link
          href="/account/invoices"
          className="font-medium text-emerald-700 hover:underline"
        >
          ← Invoices
        </Link>
      </p>
      <PageIntro
        title={invoice.invoiceNumber}
        description={`${invoice.company.name} · ${ymd(invoice.periodStart)} → ${ymd(invoice.periodEnd)}`}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <p className="text-sm text-neutral-500">Amount due</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatMYR(invoice.totalAmount)}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Due {ymd(invoice.dueDate)}</p>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Billed to {invoice.company.name}
            {invoice.company.billingEmail ? ` · ${invoice.company.billingEmail}` : ''}
            {invoice.company.phone ? ` · ${invoice.company.phone}` : ''}
            {invoice.company.billingAddress
              ? ` · ${invoice.company.billingAddress}`
              : ''}
          </p>
        </div>
        <StatusBadge tone={invoiceTone(invoice.status)}>
          {INVOICE_LABEL[invoice.status] ?? invoice.status}
        </StatusBadge>
      </div>

      <SectionCard title="Orders on this invoice">
        {invoice.orders.length === 0 ? (
          <p className="text-sm text-neutral-500">No orders attached.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {invoice.orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-mono text-sm font-semibold">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {order.employeeName}
                    {order.customer?.email ? ` · ${order.customer.email}` : ''}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {order.vendor?.businessName ?? 'Kitchen'} ·{' '}
                    {ymd(order.deliveryDate)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {order.items
                      .map((i) => `${i.quantity}× ${i.menuItem.name}`)
                      .join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {formatMYR(order.total)}
                  </p>
                  <StatusBadge tone={orderTone(order.status)}>
                    {ORDER_LABEL[order.status] ?? order.status}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
