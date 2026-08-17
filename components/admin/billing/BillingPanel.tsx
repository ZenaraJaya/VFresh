import { ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMYR, toMoney } from '@/lib/pricing';
import { malaysiaMonthBounds } from '@/lib/invoices';
import InvoiceRowActions from '@/components/admin/billing/InvoiceRowActions';

export default async function BillingPanel() {
  const { periodStart } = malaysiaMonthBounds();

  const [invoices, unbilled] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { company: { select: { name: true } } },
    }),
    prisma.order.groupBy({
      by: ['companyId'],
      where: {
        invoiceId: null,
        paymentMethod: 'COMPANY_ACCOUNT',
        status: { not: 'CANCELLED' },
        createdAt: { gte: periodStart },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  const companies = await prisma.company.findMany({
    where: { id: { in: unbilled.map((u) => u.companyId) } },
    select: { id: true, name: true, billingEmail: true },
  });
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const periodLabel = periodStart.toLocaleDateString('en-MY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuching',
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h3 className="font-semibold">Pending for {periodLabel}</h3>
        </div>
        {unbilled.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">
            Nothing outstanding this month.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Billing email</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {unbilled.map((row) => {
                  const company = companyById.get(row.companyId);
                  return (
                    <tr key={row.companyId}>
                      <td className="px-5 py-3 font-medium">
                        {company?.name ?? row.companyId}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {company?.billingEmail ?? '—'}
                      </td>
                      <td className="px-5 py-3">{row._count._all}</td>
                      <td className="px-5 py-3 font-semibold">
                        {formatMYR(toMoney(row._sum.total ?? 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h3 className="font-semibold">Issued invoices</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ReceiptText className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              No invoices have been generated yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Period</th>
                  <th className="px-5 py-3 font-semibold">Due</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-3 font-mono font-medium">
                      <Link
                        href={`/admin/billing/${invoice.id}`}
                        className="text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{invoice.company.name}</td>
                    <td className="px-5 py-3 text-neutral-600">
                      {invoice.periodStart.toISOString().slice(0, 10)} →{' '}
                      {invoice.periodEnd.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-5 py-3">
                      {invoice.dueDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {formatMYR(invoice.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold uppercase dark:bg-neutral-800">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <InvoiceRowActions
                        id={invoice.id}
                        invoiceNumber={invoice.invoiceNumber}
                        status={invoice.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
