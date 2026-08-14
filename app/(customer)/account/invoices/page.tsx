import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import {
  INVOICE_LABEL,
  loadCustomerAccount,
  ymd,
} from '@/lib/customer-account';
import {
  EmptyState,
  PageIntro,
  SectionCard,
  StatusBadge,
  invoiceTone,
} from '@/components/customer/account/ui';

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
      <PageIntro
        title="Invoices"
        description={
          me?.company
            ? `Shared with everyone at ${me.company.name}. Staff covering leave can view and pay these.`
            : 'Register your company or join with a staff link to see invoices.'
        }
      />

      {!companyId ? (
        <EmptyState
          title="No company on this account"
          body="Join with a staff link or register the company from the sign-up page."
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          body="Company-account orders go on this month’s bill."
        />
      ) : (
        <SectionCard title="Statements">
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-2 sm:px-6">Invoice</th>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-5 py-2 sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="px-5 py-3 font-mono text-xs sm:px-6">
                      <Link
                        href={`/account/invoices/${inv.id}`}
                        className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {ymd(inv.periodStart)} → {ymd(inv.periodEnd)}
                    </td>
                    <td className="px-3 py-3">{ymd(inv.dueDate)}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums">
                      {formatMYR(inv.totalAmount)}
                    </td>
                    <td className="px-5 py-3 sm:px-6">
                      <StatusBadge tone={invoiceTone(inv.status)}>
                        {INVOICE_LABEL[inv.status] ?? inv.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  );
}
