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
    where: { id, companyId },
    include: {
      company: { select: { name: true } },
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
      <p className="text-sm">
        <Link href="/account/invoices" className="text-emerald-700 hover:underline">
          ← Invoices
        </Link>
      </p>
      <h1 className="mt-3 font-mono text-2xl font-bold tracking-tight">
        {invoice.invoiceNumber}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {invoice.company.name} · {ymd(invoice.periodStart)} →{' '}
        {ymd(invoice.periodEnd)} · {INVOICE_LABEL[invoice.status] ?? invoice.status}
      </p>
      <p className="mt-2 text-lg font-semibold">{formatMYR(invoice.totalAmount)}</p>
      <p className="text-sm text-neutral-500">Due {ymd(invoice.dueDate)}</p>

      <h2 className="mt-8 text-lg font-semibold">Orders on this invoice</h2>
      {invoice.orders.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No orders attached.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {invoice.orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex flex-wrap justify-between gap-2">
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
                  <p className="font-semibold">{formatMYR(order.total)}</p>
                  <p className="text-xs text-neutral-500">
                    {ORDER_LABEL[order.status] ?? order.status}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
