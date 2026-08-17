import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { USABLE_COMPANY_WHERE } from '@/lib/company';

const companySelect = { id: true, name: true, status: true } as const;

// GET — approved companies, plus the signed-in customer's own company
// even while it is pending review (so checkout can show the name).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const companies = await prisma.company.findMany({
      where: USABLE_COMPANY_WHERE,
      select: companySelect,
      orderBy: { name: 'asc' },
    });

    if (session?.user?.role === 'CUSTOMER' && session.user.id) {
      const me = await prisma.customer.findUnique({
        where: { id: session.user.id },
        select: { company: { select: companySelect } },
      });
      if (
        me?.company &&
        !companies.some((row) => row.id === me.company!.id)
      ) {
        companies.unshift(me.company);
      }
    }

    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
