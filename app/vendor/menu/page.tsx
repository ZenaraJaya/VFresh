import VendorMenuManager from '@/components/vendor/menu/VendorMenuManager';
import { requireVendor } from '@/lib/auth-guard';

export default async function VendorMenuPage() {
  await requireVendor();
  return <VendorMenuManager />;
}
