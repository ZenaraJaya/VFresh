import { requireVendor } from '@/lib/auth-guard';
import VendorDeliveryBoard from '@/components/vendor/delivery/VendorDeliveryBoard';

export const dynamic = 'force-dynamic';

export default async function VendorDeliveryPage() {
  await requireVendor();
  return <VendorDeliveryBoard />;
}
