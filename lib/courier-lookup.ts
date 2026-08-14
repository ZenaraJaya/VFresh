import { prisma } from '@/lib/db';

export type CourierRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password?: string;
};

export async function findCourierByEmail(email: string) {
  try {
    const rows = await prisma.$queryRaw<
      { id: string; email: string; name: string; password: string }[]
    >`SELECT id, email, name, password FROM couriers WHERE lower(email) = ${email} LIMIT 1`;
    return rows[0] ?? null;
  } catch (error) {
    console.error('Courier lookup failed', error);
    return null;
  }
}

export async function findCourierById(id: string) {
  try {
    return await prisma.courier.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, password: true },
    });
  } catch (error) {
    try {
      const rows = await prisma.$queryRaw<CourierRow[]>`
        SELECT id, email, name, phone, password FROM couriers WHERE id = ${id} LIMIT 1
      `;
      return rows[0] ?? null;
    } catch {
      console.error('Courier id lookup failed', error);
      return null;
    }
  }
}
