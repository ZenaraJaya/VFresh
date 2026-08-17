import BillingPanel from '@/components/admin/billing/BillingPanel';
import IssueInvoicesButton from '@/components/admin/billing/IssueInvoicesButton';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function AdminBillingPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-neutral-500">
            Create invoices from company-account orders this month. Preview
            first, then send. Auto-billing still runs on the 1st for the
            previous month.
          </p>
        </div>
        <IssueInvoicesButton />
      </div>
      <BillingPanel />
    </div>
  );
}
