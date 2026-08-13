import VendorStoreForm from '@/components/vendor/profile/VendorProfileForm';
import { requireVendor } from '@/lib/auth-guard';

export default async function VendorStorePage() {
  await requireVendor();
  return <VendorStoreForm />;
}
