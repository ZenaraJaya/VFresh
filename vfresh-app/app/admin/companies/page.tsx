import CompanyList from '@/components/admin/companies/CompanyList';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminCompaniesPage() {
  await requireAdmin();
  return <CompanyList />;
}
