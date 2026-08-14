import CourierProfileForm from '@/components/delivery/CourierProfileForm';
import { requireCourier } from '@/lib/auth-guard';
import { findCourierById } from '@/lib/courier-lookup';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DeliveryProfilePage() {
  const session = await requireCourier('/delivery/profile');
  const me = await findCourierById(session.user.id);
  if (!me) redirect('/login?callbackUrl=/delivery/profile');

  return (
    <CourierProfileForm
      name={me.name}
      email={me.email}
      phone={me.phone ?? ''}
    />
  );
}
