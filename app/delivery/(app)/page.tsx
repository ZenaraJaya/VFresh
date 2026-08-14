import DeliveryDesk from '@/components/delivery/DeliveryDesk';
import { requireCourier } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string }>;
}) {
  const { o } = await searchParams;
  const callback = o ? `/delivery?o=${encodeURIComponent(o)}` : '/delivery';
  const session = await requireCourier(callback);

  const initialOrder = o?.trim() || '';

  return (
    <DeliveryDesk
      key={initialOrder || 'desk'}
      courierName={session.user.name || 'Rider'}
      courierId={session.user.id}
      initialOrder={initialOrder}
    />
  );
}
