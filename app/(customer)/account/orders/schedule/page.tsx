import { prisma } from '@/lib/db';
import {
  customerScheduleWhere,
  loadCustomerAccount,
} from '@/lib/customer-account';
import { weekdayName } from '@/lib/miri-date';
import OrdersSubnav from '@/components/customer/account/OrdersSubnav';
import StopScheduleButton from '@/components/customer/account/StopScheduleButton';
import {
  EmptyState,
  PageIntro,
  SectionCard,
} from '@/components/customer/account/ui';

export const dynamic = 'force-dynamic';

export default async function AccountSchedulePage() {
  const { session, email } = await loadCustomerAccount(
    '/account/orders/schedule'
  );

  const schedule = await prisma.recurringOrder.findMany({
    where: customerScheduleWhere(session.user.id, email),
    include: { vendor: { select: { businessName: true } } },
    orderBy: { weekday: 'asc' },
  });

  return (
    <>
      <PageIntro
        title="Scheduled orders"
        description="Weekly repeats until you stop them. Tick “repeat every …” at checkout to start one."
      />
      <OrdersSubnav />
      {schedule.length === 0 ? (
        <EmptyState
          title="No weekly orders"
          body="Add a standing order at checkout and it will appear here."
        />
      ) : (
        <SectionCard title="Active repeats">
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {schedule.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    Every {weekdayName(row.weekday)} · {row.vendor.businessName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {row.deliveryLocation}
                    {row.deliveryTime ? ` · ${row.deliveryTime}` : ''}
                  </p>
                </div>
                <StopScheduleButton id={row.id} />
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
