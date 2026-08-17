import { NextRequest, NextResponse } from 'next/server';
import { isMalaysiaMonthStart, issueCompanyInvoices } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get('authorization');
  if (secret && header === `Bearer ${secret}`) return true;
  if (req.headers.get('x-vercel-cron') === '1') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isMalaysiaMonthStart()) {
    return NextResponse.json({ ok: true, skipped: 'not month start' });
  }

  const result = await issueCompanyInvoices({
    period: 'previous',
    sendMail: true,
  });
  return NextResponse.json({ ok: true, ...result });
}
