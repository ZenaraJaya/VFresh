import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { calculateTotals, toMoney } from '@/lib/pricing';

const orderSchema = z.object({
  companyId: z.string().min(1),
  employeeName: z.string().min(1).max(120),
  employeeEmail: z.email().optional().or(z.literal('')),
  employeePhone: z.string().max(40).optional().or(z.literal('')),
  department: z.string().max(120).optional().or(z.literal('')),
  deliveryLocation: z.string().min(1).max(240),
  deliveryDate: z.string().min(1),
  deliveryTime: z.string().max(40).optional().or(z.literal('')),
  specialInstructions: z.string().max(1000).optional().or(z.literal('')),
  paymentMethod: z.enum(['COMPANY_ACCOUNT', 'CREDIT_CARD']).default('COMPANY_ACCOUNT'),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(500),
        notes: z.string().max(500).optional().or(z.literal(''))
      })
    )
    .min(1)
});

/** Empty strings from the form should land in the database as NULL, not ''. */
function nullIfBlank(value: string | undefined) {
  return value && value.trim() !== '' ? value.trim() : null;
}

// POST - Place an order.
export async function POST(req: NextRequest) {
  try {
    const parsed = orderSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order', details: z.treeifyError(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const company = await prisma.company.findFirst({
      where: { id: data.companyId, isActive: true }
    });
    if (!company) {
      return NextResponse.json(
        { error: 'Company account not found or inactive' },
        { status: 400 }
      );
    }

    // Prices always come from the database, never from the request body.
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: data.items.map((i) => i.menuItemId) }, available: true }
    });

    if (menuItems.length !== data.items.length) {
      return NextResponse.json(
        { error: 'One or more items are no longer available' },
        { status: 400 }
      );
    }

    const priceById = new Map(menuItems.map((m) => [m.id, m.price]));
    const lines = data.items.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      price: priceById.get(i.menuItemId)!,
      notes: nullIfBlank(i.notes)
    }));

    const { subtotal, tax, deliveryFee, total } = calculateTotals(
      lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
    );

    const order = await prisma.order.create({
      data: {
        companyId: company.id,
        employeeName: data.employeeName.trim(),
        employeeEmail: nullIfBlank(data.employeeEmail),
        employeePhone: nullIfBlank(data.employeePhone),
        department: nullIfBlank(data.department),
        deliveryLocation: data.deliveryLocation.trim(),
        deliveryDate: new Date(data.deliveryDate),
        deliveryTime: nullIfBlank(data.deliveryTime),
        specialInstructions: nullIfBlank(data.specialInstructions),
        paymentMethod: data.paymentMethod,
        // Company accounts are invoiced monthly, so payment stays pending here.
        paymentStatus: 'PENDING',
        subtotal,
        tax,
        deliveryFee,
        total: toMoney(total),
        items: { create: lines }
      },
      include: {
        company: { select: { id: true, name: true } },
        items: { include: { menuItem: true } }
      }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('POST /api/orders failed:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET - Look up one order by its human-readable number, for the confirmation page.
export async function GET(req: NextRequest) {
  try {
    const orderNumber = req.nextUrl.searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'orderNumber is required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        company: { select: { id: true, name: true } },
        items: { include: { menuItem: true } }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
