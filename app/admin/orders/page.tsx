import OrdersTable from '@/components/admin/orders/OrdersTable';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminOrdersPage() {
  await requireAdmin();
  return <OrdersTable />;
}
