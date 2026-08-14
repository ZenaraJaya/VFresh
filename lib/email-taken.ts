import { prisma } from '@/lib/db';
import { findCourierByEmail } from '@/lib/courier-lookup';

export async function emailAlreadyUsed(email: string) {
  const [admin, vendor, customer, courier] = await Promise.all([
    prisma.admin.findUnique({ where: { email }, select: { id: true } }),
    prisma.vendor.findUnique({ where: { email }, select: { id: true } }),
    prisma.customer.findUnique({ where: { email }, select: { id: true } }),
    findCourierByEmail(email),
  ]);
  return Boolean(admin || vendor || customer || courier);
}
