import { prisma } from '@/lib/db';
import {
  customerOrderWhere,
  loadCustomerAccount,
  orderInclude,
} from '@/lib/customer-account';
import { PageIntro } from '@/components/customer/account/ui';
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
      <PageIntro
        title="Order history"
        description="Completed and cancelled orders."
      />
      <OrdersSubnav />
      <OrderCardList orders={orders} />
    </>
  );
}
