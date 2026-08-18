import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { issueCompanyInvoices, previewCompanyInvoices } from '@/lib/invoices';

const schema = z.object({
  period: z.enum(['current', 'previous']).default('current'),
  companyId: z.string().min(1).optional(),
  orderIds: z.array(z.string().min(1)).optional(),
  sendMail: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const period =
    new URL(req.url).searchParams.get('period') === 'previous'
      ? 'previous'
      : 'current';
  const companyId =
    new URL(req.url).searchParams.get('companyId') || undefined;

  const preview = await previewCompanyInvoices({ period, companyId });
  return NextResponse.json(preview);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const result = await issueCompanyInvoices({
      period: parsed.data.period,
      companyId: parsed.data.companyId,
      orderIds: parsed.data.orderIds,
      sendMail: parsed.data.sendMail === true,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Issue invoices failed', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not create invoices',
      },
      { status: 500 }
    );
  }
}
