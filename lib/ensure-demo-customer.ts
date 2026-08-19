import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { USABLE_COMPANY_WHERE } from '@/lib/company';
import { DEMO_ACCOUNTS, isPublishedDemoPassword } from '@/lib/demo-accounts';

/** Upsert the published customer demo so cart checkout can always sign in. */
export async function ensurePublishedDemoCustomer(
  email: string,
  password: string
) {
  if (!isPublishedDemoPassword(email, password)) return null;

  const hash = await bcrypt.hash(password, 10);
  let companyId: string | undefined;
  try {
    const company = await prisma.company.findFirst({
      where: USABLE_COMPANY_WHERE,
      select: { id: true },
      orderBy: { name: 'asc' },
    });
    companyId = company?.id;
  } catch (error) {
    console.error('Demo customer company lookup failed', error);
  }

  return prisma.customer.upsert({
    where: { email },
    update: {
      password: hash,
      name: DEMO_ACCOUNTS.customer.label,
      ...(companyId && { companyId }),
    },
    create: {
      email,
      name: DEMO_ACCOUNTS.customer.label,
      password: hash,
      paymentMethod: 'CREDIT_CARD',
      ...(companyId ? { companyId, companyRole: 'STAFF' as const } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      companyId: true,
    },
  });
}
