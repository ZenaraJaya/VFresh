import { prisma } from '@/lib/db';
import {
  ACTIVE_ORDER_STATUSES,
  customerOrderWhere,
  loadCustomerAccount,
  orderInclude,
} from '@/lib/customer-account';
import OrdersSubnav from '@/components/customer/account/OrdersSubnav';
import OrderCardList from '@/components/customer/account/OrderCardList';

export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  const { session, email } = await loadCustomerAccount('/account/orders');

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        customerOrderWhere(session.user.id, email),
        { status: { in: ACTIVE_ORDER_STATUSES } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: orderInclude,
  });

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Open orders you placed. Teammates have their own lists.
      </p>
      <OrdersSubnav />
      <OrderCardList orders={orders} />
    </>
  );
}
