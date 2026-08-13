import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function OrdersPlacedPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n = '' } = await searchParams;
  const numbers = n
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const orders =
    numbers.length === 0
      ? []
      : await prisma.order.findMany({
          where: { orderNumber: { in: numbers } },
          include: {
            vendor: { select: { businessName: true } },
          },
          orderBy: { createdAt: 'asc' },
        });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
        <h1 className="text-3xl font-bold tracking-tight">Orders placed</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Each kitchen has its own order ID. Save these numbers.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-neutral-500">No orders found.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <div>
                <p className="text-sm font-medium">
                  {order.vendor?.businessName ?? 'Kitchen'}
                </p>
                <p className="mt-1 font-mono text-lg font-semibold">
                  {order.orderNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatMYR(order.total)}</p>
                <Link
                  href={`/order-confirmation/${order.orderNumber}`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  View this order
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/menu"
          className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600"
        >
          Order something else
        </Link>
      </div>
    </div>
  );
}
