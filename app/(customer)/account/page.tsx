import { prisma } from '@/lib/db';
import { loadCustomerAccount } from '@/lib/customer-account';
import ProfileForm from '@/components/customer/account/ProfileForm';
import PasswordForm from '@/components/customer/account/PasswordForm';
import { PageIntro, SectionCard } from '@/components/customer/account/ui';

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
      <PageIntro
        title="Profile"
        description="Your details for delivery and login. Billing lives under Billing."
      />

      <div className="space-y-6">
        <SectionCard
          title="Personal details"
          description="Used on checkout and weekly orders."
        >
          <ProfileForm name={me?.name ?? ''} phone={me?.phone ?? ''} />
          <p className="mt-4 text-sm text-neutral-500">
            Email{' '}
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              {me?.email ?? session.user.email}
            </span>{' '}
            cannot be changed.
          </p>
        </SectionCard>

        <SectionCard
          title="Company"
          description="Staff who register under the same company share invoices."
        >
          {!me?.company ? (
            <p className="text-sm text-neutral-500">
              No company linked yet.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {me.company.name}
                </span>
                . Orders and this card stay on your account.
              </p>
              <ul className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                {teammates.map((person) => (
                  <li
                    key={person.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm"
                  >
                    <span className="font-medium">
                      {person.name || person.email}
                      {person.id === session.user.id ? (
                        <span className="ml-2 text-xs font-normal text-emerald-700">
                          You
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {first?.id === person.id
                        ? 'First to join'
                        : person.email}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard title="Password" description="Change your sign-in password.">
          <PasswordForm />
        </SectionCard>
      </div>
    </>
  );
}
