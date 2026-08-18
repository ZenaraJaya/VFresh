import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';
import { formatMYR } from '@/lib/pricing';
import DeliveryProofCard from '@/components/delivery/DeliveryProofCard';
import RouteMap from '@/components/maps/RouteMap';
import OrderProgress from '@/components/customer/orders/OrderProgress';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { company: true, vendor: true, items: { include: { menuItem: true } } }
  });

  if (!order) notFound();

  const details = [
    ['Vendor', order.vendor?.businessName ?? '—'],
    ['Company', order.company.name],
    ['Billing email', order.company.billingEmail],
    ['Employee', order.employeeName],
    ['Department', order.department ?? '—'],
    ['Email', order.employeeEmail ?? '—'],
    ['Phone', order.employeePhone ?? '—'],
    ['Delivery to', order.deliveryLocation],
    ['Delivery date', order.deliveryDate.toISOString().slice(0, 10)],
    ['Delivery window', order.deliveryTime ?? 'No preference'],
    ['Payment method', order.paymentMethod.replace('_', ' ').toLowerCase()],
    ['Payment status', order.paymentStatus.toLowerCase()],
    ['Placed', order.createdAt.toISOString().replace('T', ' ').slice(0, 16)]
  ] as const;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-emerald-600 dark:text-neutral-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">{order.orderNumber}</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            {order.status.toLowerCase()}
          </p>
        </div>
        <span className="text-2xl font-bold">{formatMYR(order.total)}</span>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 font-semibold">Progress</h2>
        <OrderProgress
          orderNumber={order.orderNumber}
          initialStatus={order.status}
          initialStockDeducted={order.stockDeducted}
        />
        <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Placed</dt>
            <dd className="font-medium">
              {order.createdAt.toLocaleString('en-MY', { timeZone: 'Asia/Kuching' })}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Picked up</dt>
            <dd className="font-medium">
              {order.pickedUpAt
                ? order.pickedUpAt.toLocaleString('en-MY', { timeZone: 'Asia/Kuching' })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Delivered</dt>
            <dd className="font-medium">
              {order.deliveredAt
                ? order.deliveredAt.toLocaleString('en-MY', { timeZone: 'Asia/Kuching' })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Rider</dt>
            <dd className="font-medium">{order.courierName ?? '—'}</dd>
          </div>
        </dl>
        <div className="mt-4 space-y-4">
          <RouteMap
            lat={order.deliveryLat}
            lng={order.deliveryLng}
            address={order.deliveryLocation}
          />
          <DeliveryProofCard
            proof={order.delayProof}
            takenAt={order.proofTakenAt}
            lat={order.proofLat}
            lng={order.proofLng}
            reason={order.delayReason}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 font-semibold">Details</h2>
          <dl className="space-y-2 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-neutral-500 dark:text-neutral-400">
                  {label}
                </dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {order.specialInstructions && (
            <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-800">
              <p className="mb-1 font-medium">Special instructions</p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {order.specialInstructions}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 font-semibold">Items</h2>
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
              <dt className="text-neutral-500">Subtotal</dt>
              <dd>{formatMYR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">SST</dt>
              <dd>{formatMYR(order.tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Delivery</dt>
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
      </div>
    </div>
  );
}
