import { prisma } from '@/lib/db';

export type AuthAdmin = {
  id: string;
  email: string;
  password: string;
  name: string | null;
};

export type AuthVendor = {
  id: string;
  email: string;
  password: string;
  businessName: string;
  status: string;
};

export type AuthCustomer = {
  id: string;
  email: string;
  name: string | null;
  password: string;
  companyId: string | null;
};

export async function findAdminAuthByEmail(email: string) {
  try {
    const rows = await prisma.$queryRaw<AuthAdmin[]>`
      SELECT id, email, password, name
      FROM admins
      WHERE lower(email) = ${email}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (error) {
    console.error('Admin auth lookup failed', error);
    return null;
  }
}

export async function findVendorAuthByEmail(email: string) {
  try {
    const rows = await prisma.$queryRaw<AuthVendor[]>`
      SELECT id, email, password, "businessName", status
      FROM vendors
      WHERE lower(email) = ${email}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (error) {
    console.error('Vendor auth lookup failed', error);
    return null;
  }
}

export async function findCustomerAuthByEmail(email: string) {
  try {
    const rows = await prisma.$queryRaw<AuthCustomer[]>`
      SELECT id, email, name, password, "companyId"
      FROM customers
      WHERE lower(email) = ${email}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (error) {
    console.error('Customer auth lookup failed', error);
    return null;
  }
}

export async function persistPasswordHash(
  table: 'admins' | 'vendors' | 'customers' | 'couriers',
  id: string,
  passwordHash: string
) {
  try {
    if (table === 'admins') {
      await prisma.$executeRaw`UPDATE admins SET password = ${passwordHash}, "updatedAt" = NOW() WHERE id = ${id}`;
    } else if (table === 'vendors') {
      await prisma.$executeRaw`UPDATE vendors SET password = ${passwordHash}, "updatedAt" = NOW() WHERE id = ${id}`;
    } else if (table === 'customers') {
      await prisma.$executeRaw`UPDATE customers SET password = ${passwordHash}, "updatedAt" = NOW() WHERE id = ${id}`;
    } else {
      await prisma.$executeRaw`UPDATE couriers SET password = ${passwordHash}, "updatedAt" = NOW() WHERE id = ${id}`;
    }
  } catch (error) {
    console.error('Password rehash failed', error);
  }
}
