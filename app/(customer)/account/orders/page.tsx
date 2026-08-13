import { prisma } from '@/lib/db';
import {
  ACTIVE_ORDER_STATUSES,
  customerOrderWhere,
  loadCustomerAccount,
  orderInclude,
} from '@/lib/customer-account';
import { PageIntro } from '@/components/customer/account/ui';
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
      <PageIntro
        title="Orders"
        description="Open orders you placed. Teammates have their own lists."
      />
      <OrdersSubnav />
      <OrderCardList orders={orders} />
    </>
  );
}
