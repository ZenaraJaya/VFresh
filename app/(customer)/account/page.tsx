import { prisma } from '@/lib/db';
import { loadCustomerAccount } from '@/lib/customer-account';
import { isCompanyUsable, companyStatusLabel } from '@/lib/company';
import ProfileForm from '@/components/customer/account/ProfileForm';
import PasswordForm from '@/components/customer/account/PasswordForm';
import InviteLinkPanel from '@/components/customer/account/InviteLinkPanel';
import RegisterCompanyForm from '@/components/customer/account/RegisterCompanyForm';
import { PageIntro, SectionCard, StatusBadge } from '@/components/customer/account/ui';

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const { session, me, companyId } = await loadCustomerAccount('/account');

  const teammates = companyId
    ? await prisma.customer.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          companyRole: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const first = teammates[0];
  const isOwner = me?.companyRole === 'OWNER';
  const companyApproved = isCompanyUsable(me?.company);

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
          <ProfileForm
            name={me?.name ?? ''}
            phone={me?.phone ?? ''}
            jobTitle={me?.jobTitle ?? ''}
          />
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
          description="Register your workplace from this profile. Create a staff link so teammates can join."
        >
          {!me?.company ? (
            <RegisterCompanyForm defaultJobTitle={me?.jobTitle ?? ''} />
          ) : (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {me.company.name}
                </span>
                <span className="mx-2">
                  <StatusBadge
                    tone={
                      me.company.status === 'APPROVED'
                        ? 'success'
                        : me.company.status === 'REJECTED'
                          ? 'danger'
                          : 'warn'
                    }
                  >
                    {companyStatusLabel(me.company.status)}
                  </StatusBadge>
                </span>
                {isOwner ? 'You manage this account' : 'Staff access'}
                {me.jobTitle ? ` · ${me.jobTitle}` : ''}.
              </p>
              {me.company.status === 'PENDING' ? (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Saved for review. After an admin approves the company,
                  invoices are emailed to {me.company.billingEmail}.
                </p>
              ) : null}
              {me.company.status === 'REJECTED' ? (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  This registration was not approved
                  {me.company.reviewNote ? `: ${me.company.reviewNote}` : '.'}
                </p>
              ) : null}
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
                      {person.companyRole === 'OWNER'
                        ? 'Owner'
                        : person.jobTitle || person.email}
                    </span>
                  </li>
                ))}
              </ul>
              {isOwner && companyApproved ? (
                <InviteLinkPanel companyName={me.company.name} />
              ) : isOwner ? null : (
                <p className="mt-4 text-xs text-neutral-500">
                  Ask {first?.name || 'your HR or manager'} for a staff link.
                </p>
              )}
              {isOwner ? (
                <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-neutral-800">
                  <h3 className="mb-3 text-sm font-semibold">
                    Invoice billing details
                  </h3>
                  <RegisterCompanyForm
                    key={`${me.company.id}-${me.company.billingEmail}`}
                    defaultJobTitle={me.jobTitle ?? ''}
                    company={{
                      id: me.company.id,
                      name: me.company.name,
                      billingEmail: me.company.billingEmail,
                      billingAddress: me.company.billingAddress,
                      phone: me.company.phone,
                    }}
                  />
                </div>
              ) : (
                <dl className="mt-4 grid gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div>
                    <dt className="text-xs text-neutral-500">Billing email</dt>
                    <dd>{me.company.billingEmail}</dd>
                  </div>
                  {me.company.billingAddress ? (
                    <div>
                      <dt className="text-xs text-neutral-500">
                        Billing address
                      </dt>
                      <dd>{me.company.billingAddress}</dd>
                    </div>
                  ) : null}
                </dl>
              )}
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
