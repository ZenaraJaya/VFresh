import DeliveryHeader from '@/components/delivery/DeliveryHeader';
import { requireCourier } from '@/lib/auth-guard';

export default async function DeliveryAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCourier();

  return (
    <div className="flex min-h-screen flex-1 flex-col vf-gradient">
      <DeliveryHeader name={session.user.name || 'Rider'} />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
