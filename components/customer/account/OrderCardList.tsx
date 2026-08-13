import Link from 'next/link';
import { formatMYR } from '@/lib/pricing';
import { ORDER_LABEL, ymd } from '@/lib/customer-account';

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
      <p className="mt-3 rounded-2xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No orders here yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
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
              <p className="font-semibold">{formatMYR(order.total)}</p>
              <p className="text-xs text-neutral-500">
                {ORDER_LABEL[order.status] ?? order.status}
              </p>
              <Link
                href={`/order-confirmation/${encodeURIComponent(order.orderNumber)}`}
                className="text-xs font-medium text-emerald-600"
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
