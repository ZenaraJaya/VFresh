import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  cancelInvoice,
  loadAdminInvoice,
  saveInvoicePreview,
  sendInvoice,
  setInvoiceOrder,
  syncInvoiceWithMonth,
} from '@/lib/invoices';

type RouteContext = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('sync') }),
  z.object({
    action: z.literal('order'),
    orderId: z.string().min(1),
    attach: z.boolean(),
  }),
  z.object({
    action: z.literal('save'),
    invoiceNumber: z.string().optional(),
    dueDate: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    periodEndInclusive: z.string().optional(),
    companyName: z.string().optional(),
    billingEmail: z.string().optional(),
    billingAddress: z.string().optional(),
    phone: z.string().optional(),
  }),
  z.object({ action: z.literal('send') }),
  z.object({ action: z.literal('cancel') }),
]);

export async function GET(_req: Request, { params }: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const invoice = await loadAdminInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  }

  try {
    if (parsed.data.action === 'sync') {
      const invoice = await syncInvoiceWithMonth(id);
      if (!invoice) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }
    if (parsed.data.action === 'order') {
      const invoice = await setInvoiceOrder(
        id,
        parsed.data.orderId,
        parsed.data.attach
      );
      if (!invoice) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }
    if (parsed.data.action === 'cancel') {
      const invoice = await cancelInvoice(id);
      if (!invoice) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }
    if (parsed.data.action === 'send') {
      const invoice = await sendInvoice(id);
      if (!invoice) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }
    if (parsed.data.action === 'save') {
      const invoice = await saveInvoicePreview(id, parsed.data);
      if (!invoice) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Update failed',
      },
      { status: 400 }
    );
  }
}
