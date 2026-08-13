import { requireVendor } from '@/lib/auth-guard';
import VendorOrdersBoard from '@/components/vendor/orders/VendorOrdersBoard';

export const dynamic = 'force-dynamic';

export default async function VendorOrdersPage() {
  await requireVendor();
  return <VendorOrdersBoard />;
}
