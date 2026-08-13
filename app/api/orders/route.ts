import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { calculateTotals, toMoney } from '@/lib/pricing';
import { isVendorAcceptingOrders } from '@/lib/vendor-availability';
import { assertSellableForCheckout } from '@/lib/daily-pack';
import { newOrderNumber } from '@/lib/order-number';

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
        notes: z.string().max(500).optional().or(z.literal('')),
      })
    )
    .min(1),
});

function nullIfBlank(value: string | undefined) {
  return value && value.trim() !== '' ? value.trim() : null;
}

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
      where: { id: data.companyId, isActive: true },
    });
    if (!company) {
      return NextResponse.json(
        { error: 'Company account not found or inactive' },
        { status: 400 }
      );
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: data.items.map((i) => i.menuItemId) },
        available: true,
      },
      include: { vendor: true },
    });

    if (menuItems.length !== data.items.length) {
      return NextResponse.json(
        { error: 'One or more items are no longer available' },
        { status: 400 }
      );
    }

    const missingVendor = menuItems.find((m) => !m.vendorId || !m.vendor);
    if (missingVendor) {
      return NextResponse.json(
        { error: 'Every dish must belong to a vendor' },
        { status: 400 }
      );
    }

    const byVendor = new Map<string, typeof menuItems>();
    for (const item of menuItems) {
      const key = item.vendorId!;
      const list = byVendor.get(key) ?? [];
      list.push(item);
      byVendor.set(key, list);
    }

    for (const items of byVendor.values()) {
      const vendor = items[0].vendor!;
      if (!isVendorAcceptingOrders(vendor)) {
        return NextResponse.json(
          { error: `${vendor.businessName} is closed and not taking orders` },
          { status: 400 }
        );
      }
    }

    try {
      await assertSellableForCheckout(data.items);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Not enough packs left' },
        { status: 400 }
      );
    }

    const qtyNotes = new Map(
      data.items.map((i) => [
        i.menuItemId,
        { quantity: i.quantity, notes: nullIfBlank(i.notes) },
      ])
    );

    const shared = {
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
      paymentStatus: 'PENDING' as const,
    };

    const created = await prisma.$transaction(
      [...byVendor.entries()].map(([vendorId, vendorItems]) => {
        const lines = vendorItems.map((m) => {
          const q = qtyNotes.get(m.id)!;
          return {
            menuItemId: m.id,
            quantity: q.quantity,
            price: m.price,
            notes: q.notes,
          };
        });
        const { subtotal, tax, deliveryFee, total } = calculateTotals(
          lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
        );

        return prisma.order.create({
          data: {
            ...shared,
            vendorId,
            orderNumber: newOrderNumber(),
            subtotal,
            tax,
            deliveryFee,
            total: toMoney(total),
            items: { create: lines },
          },
          include: {
            company: { select: { id: true, name: true } },
            vendor: { select: { id: true, businessName: true, slug: true } },
            items: { include: { menuItem: true } },
          },
        });
      })
    );

    return NextResponse.json(
      {
        orders: created,
        orderNumber: created[0]?.orderNumber,
        orderNumbers: created.map((o) => o.orderNumber),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/orders failed:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

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
        vendor: { select: { id: true, businessName: true, slug: true } },
        items: { include: { menuItem: true } },
      },
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
