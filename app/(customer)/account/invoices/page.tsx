import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import {
  INVOICE_LABEL,
  loadCustomerAccount,
  ymd,
} from '@/lib/customer-account';

export const dynamic = 'force-dynamic';

export default async function AccountInvoicesPage() {
  const { me, companyId } = await loadCustomerAccount('/account/invoices');

  const invoices = companyId
    ? await prisma.invoice.findMany({
        where: {
          companyId,
          status: { in: ['SENT', 'PAID', 'OVERDUE'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 80,
      })
    : [];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Invoices</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {me?.company
          ? `Shared with everyone at ${me.company.name}.`
          : 'Register with a company to see invoices.'}
      </p>

      {!companyId ? (
        <p className="mt-6 text-sm text-neutral-500">
          No company on this account.
        </p>
      ) : invoices.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No invoices yet. Company orders go on this month’s bill.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/account/invoices/${inv.id}`}
                      className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {ymd(inv.periodStart)} → {ymd(inv.periodEnd)}
                  </td>
                  <td className="px-4 py-3">{ymd(inv.dueDate)}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatMYR(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    {INVOICE_LABEL[inv.status] ?? inv.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
