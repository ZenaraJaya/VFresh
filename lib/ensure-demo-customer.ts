import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { DEMO_ACCOUNTS, isPublishedDemoPassword } from '@/lib/demo-accounts';
import { findCustomerAuthByEmail } from '@/lib/auth-lookups';

function newCustomerId() {
  return `c${randomBytes(12).toString('hex')}`;
}

/** Upsert the published customer demo so cart checkout can always sign in. */
export async function ensurePublishedDemoCustomer(
  email: string,
  password: string
) {
  if (!isPublishedDemoPassword(email, password)) return null;

  const hash = await bcrypt.hash(password, 10);
  const name = DEMO_ACCOUNTS.customer.label;

  try {
    const updated = await prisma.$executeRaw`
      UPDATE customers
      SET password = ${hash}, name = ${name}, "updatedAt" = NOW()
      WHERE lower(email) = ${email}
    `;
    if (updated === 0) {
      const id = newCustomerId();
      await prisma.$executeRaw`
        INSERT INTO customers (
          id, email, password, name, "paymentMethod", "companyRole", cart, "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${email}, ${hash}, ${name}, 'CREDIT_CARD', 'STAFF', '[]'::jsonb, NOW(), NOW()
        )
      `;
    }
  } catch (error) {
    console.error('Demo customer upsert failed', error);
  }

  return findCustomerAuthByEmail(email);
}
