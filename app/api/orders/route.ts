import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { storefrontWhere } from '@/lib/public-menu';
import { authOptions } from '@/lib/auth';
import { calculateTotals, toMoney } from '@/lib/pricing';
import {
  isHmInVendorHours,
  isVendorAcceptingOrders,
  isVendorOnLunchBreak,
} from '@/lib/vendor-availability';
import { assertSellableForCheckout } from '@/lib/daily-pack';
import { releaseExpiredPaymentHolds } from '@/lib/payment-hold';
import { newOrderNumber } from '@/lib/order-number';
import { createStandingOrders } from '@/lib/standing-orders';
import { isCompanyUsable } from '@/lib/company';
import { normalizeMyPhone } from '@/lib/phone';
import { deliveryTrackPayload, isDeliveryTooSoon } from '@/lib/delivery-sla';

const orderSchema = z.object({
  companyId: z.string().min(1),
  employeeName: z.string().min(1).max(120),
  employeeEmail: z.email().optional().or(z.literal('')),
  employeePhone: z.string().max(40).optional().or(z.literal('')),
  department: z.string().max(120).optional().or(z.literal('')),
  deliveryLocation: z.string().min(1).max(240),
  deliveryLat: z.number().gte(-90).lte(90).optional(),
  deliveryLng: z.number().gte(-180).lte(180).optional(),
  deliveryDate: z.string().min(1),
  deliveryTime: z.string().min(1).max(40),
  specialInstructions: z.string().max(1000).optional().or(z.literal('')),
  paymentMethod: z.enum(['COMPANY_ACCOUNT', 'CREDIT_CARD']).default('COMPANY_ACCOUNT'),
  repeatWeekly: z.boolean().optional(),
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

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Sign in or register to place an order' },
        { status: 401 }
      );
    }

    const parsed = orderSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order', details: z.treeifyError(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const me = await prisma.customer.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true, email: true, name: true },
    });
    if (!me) {
      return NextResponse.json({ error: 'Account not found' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });
    if (!company || company.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Company account is not available' },
        { status: 400 }
      );
    }

    const ownCompany = me.companyId === company.id;
    if (me.companyId && !ownCompany) {
      return NextResponse.json(
        { error: 'Orders must use your registered company' },
        { status: 400 }
      );
    }

    if (!ownCompany && !isCompanyUsable(company)) {
      return NextResponse.json(
        { error: 'Select an approved company account' },
        { status: 400 }
      );
    }

    if (
      data.paymentMethod === 'COMPANY_ACCOUNT' &&
      !isCompanyUsable(company)
    ) {
      return NextResponse.json(
        {
          error:
            'Company invoicing starts after an admin approves your workplace. Pay by card until then.',
        },
        { status: 400 }
      );
    }

    const menuItems = await prisma.menuItem.findMany({
      where: await storefrontWhere({
        id: { in: data.items.map((i) => i.menuItemId) },
      }),
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

    const kitchenVendors = [...byVendor.values()].map((items) => items[0].vendor!);
    const [year, month, day] = data.deliveryDate.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (!isHmInVendorHours(kitchenVendors, weekday, data.deliveryTime)) {
      return NextResponse.json(
        {
          error:
            'Pick a delivery time during the kitchen’s open hours for that date',
        },
        { status: 400 }
      );
    }

    if (isDeliveryTooSoon(data.deliveryDate, data.deliveryTime)) {
      return NextResponse.json(
        {
          error:
            'Delivery must be at least 1 hour 30 minutes from now so the kitchen can prepare and arrive on time',
        },
        { status: 400 }
      );
    }

    for (const items of byVendor.values()) {
      const vendor = items[0].vendor!;
      if (!isVendorAcceptingOrders(vendor)) {
        return NextResponse.json(
          {
            error: isVendorOnLunchBreak(vendor)
              ? `${vendor.businessName} is on lunch break and not taking orders`
              : `${vendor.businessName} is closed and not taking orders`,
          },
          { status: 400 }
        );
      }
    }

    try {
      await releaseExpiredPaymentHolds();
    } catch (err) {
      console.error('payment hold release', err);
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
      customerId: me.id,
      employeeName: data.employeeName.trim(),
      employeeEmail:
        nullIfBlank(data.employeeEmail) ?? session.user.email ?? null,
      employeePhone: normalizeMyPhone(data.employeePhone) ?? null,
      department: nullIfBlank(data.department),
      deliveryLocation: data.deliveryLocation.trim(),
      deliveryLat: data.deliveryLat ?? null,
      deliveryLng: data.deliveryLng ?? null,
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

    if (data.repeatWeekly) {
      try {
      const [y, mo, day] = data.deliveryDate.split('-').map(Number);
      const weekday = new Date(Date.UTC(y, mo - 1, day)).getUTCDay();
      await createStandingOrders({
        weekday,
        firstDeliveryYmd: data.deliveryDate.slice(0, 10),
        companyId: company.id,
        customerId: me.id,
        employeeName: shared.employeeName,
        employeeEmail: shared.employeeEmail,
        employeePhone: shared.employeePhone,
        department: shared.department,
        deliveryLocation: shared.deliveryLocation,
        deliveryTime: shared.deliveryTime,
        specialInstructions: shared.specialInstructions,
        paymentMethod: data.paymentMethod,
        kitchens: [...byVendor.entries()].map(([vendorId, vendorItems]) => ({
          vendorId,
          items: vendorItems.map((m) => {
            const q = qtyNotes.get(m.id)!;
            return {
              menuItemId: m.id,
              quantity: q.quantity,
              notes: q.notes,
            };
          }),
        })),
      });
      } catch (err) {
        console.error('standing order save failed', err);
      }
    }

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

    try {
      await releaseExpiredPaymentHolds();
    } catch (err) {
      console.error('payment hold release', err);
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

    return NextResponse.json(
      {
        ...order,
        track: deliveryTrackPayload(order),
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
