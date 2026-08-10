import MenuManager from '@/components/admin/menu/MenuManager';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminMenuPage() {
  await requireAdmin();
  return <MenuManager />;
}
