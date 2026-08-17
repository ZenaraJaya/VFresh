import VendorKitchenPanel from '@/components/admin/vendors/VendorKitchenPanel';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminVendorDetailPage() {
  await requireAdmin();
  return <VendorKitchenPanel />;
}
