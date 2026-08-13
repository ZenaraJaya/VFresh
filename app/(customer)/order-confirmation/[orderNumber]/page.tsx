import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, CheckCircle2, Clock, MapPin, Receipt } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import OrderDeliveryNote from '@/components/customer/orders/OrderDeliveryNote';
import OrderProgress from '@/components/customer/orders/OrderProgress';

export const dynamic = 'force-dynamic';

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
      vendor: { select: { businessName: true, slug: true } },
      items: { include: { menuItem: true } }
    }
  });

  if (!order) notFound();

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-3 py-8 sm:px-4 sm:py-12">
      <div className="mb-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500 sm:h-14 sm:w-14" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Order placed</h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base dark:text-neutral-400">
          {order.vendor
            ? `${order.vendor.businessName} has your order. Keep this number handy.`
            : "We've sent the kitchen your order. Keep this number handy."}
        </p>
        <p className="mt-4 inline-block max-w-full break-all rounded-xl bg-neutral-100 px-3 py-2 font-mono text-sm font-semibold sm:px-4 sm:text-lg dark:bg-neutral-800">
          {order.orderNumber}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Progress
        </h2>
        <OrderProgress
          orderNumber={order.orderNumber}
          initialStatus={order.status}
          initialStockDeducted={order.stockDeducted}
        />
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
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {order.vendor
            ? `${order.vendor.businessName} · ${order.employeeName}`
            : `${order.employeeName}&apos;s order`}
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

      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <OrderDeliveryNote
          orderNumber={order.orderNumber}
          status={order.status}
        />
        <Link
          href="/menu"
          className="inline-block w-full max-w-sm rounded-xl border border-neutral-200 px-6 py-3 font-medium transition hover:bg-neutral-50 sm:w-auto dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Order something else
        </Link>
      </div>
    </div>
  );
}
