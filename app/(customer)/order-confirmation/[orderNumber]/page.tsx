import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, CheckCircle2, Clock, MapPin, Receipt } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Received',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Being prepared',
  READY: 'Ready for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

export default async function OrderConfirmationPage({
  params
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber: decodeURIComponent(orderNumber) },
    include: {
      company: { select: { name: true } },
      items: { include: { menuItem: true } }
    }
  });

  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
        <h1 className="text-3xl font-bold tracking-tight">Order placed</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          We&apos;ve sent the kitchen your order. Keep this number handy.
        </p>
        <p className="mt-4 inline-block rounded-xl bg-neutral-100 px-4 py-2 font-mono text-lg font-semibold dark:bg-neutral-800">
          {order.orderNumber}
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Delivery
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {order.deliveryLocation}
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-emerald-500" />
              {order.deliveryDate.toISOString().slice(0, 10)}
            </li>
            {order.deliveryTime && (
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-emerald-500" />
                {order.deliveryTime}
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Billing
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {order.company.name}
            </li>
            <li className="text-neutral-600 dark:text-neutral-400">
              {order.paymentMethod === 'COMPANY_ACCOUNT'
                ? "Added to this month's invoice"
                : 'Paid by card'}
            </li>
            <li>
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">
          {order.employeeName}&apos;s order
        </h2>

        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                {item.menuItem.image && (
                  <Image
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {item.quantity} × {item.menuItem.name}
                </p>
                {item.notes && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {item.notes}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium">
                {formatMYR(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
          <div className="flex justify-between">
            <dt className="text-neutral-600 dark:text-neutral-400">Subtotal</dt>
            <dd>{formatMYR(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600 dark:text-neutral-400">SST</dt>
            <dd>{formatMYR(order.tax)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600 dark:text-neutral-400">Delivery</dt>
            <dd>
              {order.deliveryFee === 0 ? 'Free' : formatMYR(order.deliveryFee)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold dark:border-neutral-800">
            <dt>Total</dt>
            <dd>{formatMYR(order.total)}</dd>
          </div>
        </dl>
      </div>

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
