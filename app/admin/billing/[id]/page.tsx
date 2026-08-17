import InvoiceEditor from '@/components/admin/billing/InvoiceEditor';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminInvoicePage() {
  await requireAdmin();
  return <InvoiceEditor />;
}
