export const USABLE_COMPANY_WHERE = {
  isActive: true,
  status: 'APPROVED' as const,
};

export function isCompanyUsable(
  company:
    | { isActive: boolean; status: string }
    | null
    | undefined
) {
  return Boolean(
    company && company.isActive && company.status === 'APPROVED'
  );
}

export function companyStatusLabel(status: string) {
  if (status === 'PENDING') return 'Pending review';
  if (status === 'REJECTED') return 'Rejected';
  return 'Approved';
}
