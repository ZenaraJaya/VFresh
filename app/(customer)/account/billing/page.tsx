import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import {
  customerOrderWhere,
  loadCustomerAccount,
  ymd,
} from '@/lib/customer-account';
import BillingForm from '@/components/customer/account/BillingForm';
import {
  EmptyState,
  PageIntro,
  SectionCard,
} from '@/components/customer/account/ui';

export const dynamic = 'force-dynamic';

export default async function AccountBillingPage() {
  const { session, me, email, companyId } = await loadCustomerAccount(
    '/account/billing'
  );

  const [invoices, orders] = await Promise.all([
    companyId
      ? prisma.invoice.findMany({
          where: {
            companyId,
            OR: [{ status: 'PAID' }, { paidAt: { not: null } }],
          },
          orderBy: { paidAt: 'desc' },
          take: 40,
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
      take: 40,
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

  const company = me?.company;

  return (
    <>
      <PageIntro
        title="Billing"
        description="You pay for orders. Save the billing address and card we should charge."
      />

      <div className="space-y-6">
        <SectionCard
          title="Payment details"
          description="Used on checkout and receipts. Teammates at the same company share invoices, not this card."
        >
          <BillingForm
            initial={{
              paymentMethod: me?.paymentMethod ?? 'CREDIT_CARD',
              billingName:
                me?.billingName || me?.name || session.user.name || '',
              billingEmail:
                me?.billingEmail || me?.email || company?.billingEmail || '',
              billingPhone: me?.billingPhone || me?.phone || '',
              billingAddress:
                me?.billingAddress || company?.billingAddress || '',
              billingCity: me?.billingCity || 'Miri',
              billingPostcode: me?.billingPostcode || '',
              billingState: me?.billingState || 'Sarawak',
              cardholderName: me?.cardholderName || me?.name || '',
              cardBrand: me?.cardBrand || '',
              cardLast4: me?.cardLast4 || '',
              cardExpMonth: me?.cardExpMonth ? String(me.cardExpMonth) : '',
              cardExpYear: me?.cardExpYear ? String(me.cardExpYear) : '',
            }}
          />
        </SectionCard>

        <SectionCard
          title="Payment history"
          description={
            company
              ? `Paid invoices for ${company.name}, plus your card charges.`
              : 'Charges on your orders.'
          }
        >
          {payments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              body="After you pay an order or an invoice, it will show up here."
            />
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-neutral-500">
                      {ymd(p.date)} · {p.method}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatMYR(p.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
