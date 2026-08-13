import { prisma } from '@/lib/db';
import {
  customerOrderWhere,
  loadCustomerAccount,
  orderInclude,
} from '@/lib/customer-account';
import OrdersSubnav from '@/components/customer/account/OrdersSubnav';
import OrderCardList from '@/components/customer/account/OrderCardList';

export const dynamic = 'force-dynamic';

export default async function AccountOrderHistoryPage() {
  const { session, email } = await loadCustomerAccount(
    '/account/orders/history'
  );

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        customerOrderWhere(session.user.id, email),
        { status: { in: ['DELIVERED', 'CANCELLED'] } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
    include: orderInclude,
  });

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Order history
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Completed and cancelled orders.
      </p>
      <OrdersSubnav />
      <OrderCardList orders={orders} />
    </>
  );
}
