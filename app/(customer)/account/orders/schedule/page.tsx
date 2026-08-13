import { prisma } from '@/lib/db';
import {
  customerScheduleWhere,
  loadCustomerAccount,
} from '@/lib/customer-account';
import { weekdayName } from '@/lib/miri-date';
import OrdersSubnav from '@/components/customer/account/OrdersSubnav';
import StopScheduleButton from '@/components/customer/account/StopScheduleButton';

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
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Scheduled orders
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Weekly repeats until you stop them. Tick “repeat every …” at checkout
        to start one.
      </p>
      <OrdersSubnav />
      {schedule.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No weekly orders yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {schedule.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-800"
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
      )}
    </>
  );
}
