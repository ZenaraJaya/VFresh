import Link from 'next/link';
import { formatMYR } from '@/lib/pricing';
import { ORDER_LABEL, ymd } from '@/lib/customer-account';
import {
  EmptyState,
  StatusBadge,
  orderTone,
} from '@/components/customer/account/ui';

type OrderRow = {
  id: string;
  orderNumber: string;
  deliveryDate: Date;
  deliveryTime: string | null;
  total: number;
  status: string;
  vendor: { businessName: string } | null;
  items: { quantity: number; menuItem: { name: string } }[];
};

export default function OrderCardList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders here"
        body="When you place an order, it will appear in this list."
      />
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
              <p className="mt-0.5 text-sm text-neutral-500">
                {order.vendor?.businessName ?? 'Kitchen'} · {ymd(order.deliveryDate)}
                {order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {order.items
                  .map((i) => `${i.quantity}× ${i.menuItem.name}`)
                  .join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">{formatMYR(order.total)}</p>
              <div className="mt-1">
                <StatusBadge tone={orderTone(order.status)}>
                  {ORDER_LABEL[order.status] ?? order.status}
                </StatusBadge>
              </div>
              <Link
                href={`/order-confirmation/${encodeURIComponent(order.orderNumber)}`}
                className="mt-2 inline-block text-xs font-semibold text-emerald-700"
              >
                Track
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
