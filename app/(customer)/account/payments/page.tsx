import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import {
  customerOrderWhere,
  loadCustomerAccount,
  ymd,
} from '@/lib/customer-account';

export const dynamic = 'force-dynamic';

export default async function AccountPaymentsPage() {
  const { session, me, email, companyId } = await loadCustomerAccount(
    '/account/payments'
  );

  const [invoices, orders] = await Promise.all([
    companyId
      ? prisma.invoice.findMany({
          where: {
            companyId,
            OR: [{ status: 'PAID' }, { paidAt: { not: null } }],
          },
          orderBy: { paidAt: 'desc' },
          take: 80,
        })
      : Promise.resolve([]),
    prisma.order.findMany({
      where: {
        AND: [
          customerOrderWhere(session.user.id, email),
          { paymentStatus: 'PAID' },
        ],
      },
      orderBy: { paidAt: 'desc' },
      take: 80,
    }),
  ]);

  const payments = [
    ...invoices.map((inv) => ({
      id: `inv-${inv.id}`,
      label: inv.invoiceNumber || 'Invoice',
      date: inv.paidAt ?? inv.updatedAt,
      amount: inv.totalAmount,
      method: 'Company invoice',
    })),
    ...orders.map((o) => ({
      id: `ord-${o.id}`,
      label: o.orderNumber,
      date: o.paidAt ?? o.updatedAt,
      amount: o.total,
      method: o.paymentMethod === 'CREDIT_CARD' ? 'Card' : 'Company account',
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Payment history
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {me?.company
          ? `Paid company invoices for ${me.company.name}, plus your own card payments.`
          : 'Payments on your orders.'}
      </p>

      {payments.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No payments recorded yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
            >
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-neutral-500">
                  {ymd(p.date)} · {p.method}
                </p>
              </div>
              <p className="font-semibold">{formatMYR(p.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
