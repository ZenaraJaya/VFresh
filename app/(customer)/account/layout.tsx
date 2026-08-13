import { redirect } from 'next/navigation';
import AccountNav from '@/components/customer/account/AccountNav';
import { loadCustomerAccount } from '@/lib/customer-account';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, me } = await loadCustomerAccount('/account');
  if (!me) redirect('/login?callbackUrl=/account');

  return (
    <div className="min-h-[70vh] bg-[#f4f6f5] dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <AccountNav
            name={me.name ?? session.user.name ?? ''}
            email={me.email}
            company={me.company?.name ?? null}
          />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
