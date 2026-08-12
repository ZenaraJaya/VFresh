import VendorProfileForm from '@/components/vendor/profile/VendorProfileForm';
import { requireVendor } from '@/lib/auth-guard';

export default async function VendorProfilePage() {
  await requireVendor();
  return <VendorProfileForm />;
}
