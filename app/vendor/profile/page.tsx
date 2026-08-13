import VendorAccountForm from '@/components/vendor/account/VendorAccountForm';
import { requireVendor } from '@/lib/auth-guard';

export default async function VendorProfilePage() {
  await requireVendor();
  return <VendorAccountForm />;
}
