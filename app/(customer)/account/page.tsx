import { prisma } from '@/lib/db';
import { loadCustomerAccount } from '@/lib/customer-account';
import ProfileForm from '@/components/customer/account/ProfileForm';
import PasswordForm from '@/components/customer/account/PasswordForm';

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const { session, me, companyId } = await loadCustomerAccount('/account');

  const teammates = companyId
    ? await prisma.customer.findMany({
        where: { companyId },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const first = teammates[0];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {me?.company
          ? `${me.company.name} · ${session.user.email}`
          : session.user.email}
      </p>

      <section className="mt-8 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Your details</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Used on checkout and weekly orders.
        </p>
        <div className="mt-4">
          <ProfileForm name={me?.name ?? ''} phone={me?.phone ?? ''} />
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          Email{' '}
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {me?.email ?? session.user.email}
          </span>{' '}
          cannot be changed.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Company</h2>
        {!me?.company ? (
          <p className="mt-2 text-sm text-neutral-500">
            No company linked. Register again with your company to share
            invoices with teammates.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              You share invoices and payment history with everyone registered
              under <strong>{me.company.name}</strong>. Orders and weekly
              schedules stay on your own account.
            </p>
            <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
              {teammates.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                >
                  <span>
                    {person.name || person.email}
                    {person.id === session.user.id ? ' (you)' : ''}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {first?.id === person.id
                      ? 'First to join this company'
                      : person.email}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Password</h2>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </section>
    </>
  );
}
