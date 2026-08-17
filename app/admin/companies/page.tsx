import CompanyList from '@/components/admin/companies/CompanyList';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function AdminCompaniesPage() {
  await requireAdmin();
  return <CompanyList />;
}
