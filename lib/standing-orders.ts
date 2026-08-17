import { prisma } from '@/lib/db';
import { storefrontWhere } from '@/lib/public-menu';
import { calculateTotals, toMoney } from '@/lib/pricing';
import { newOrderNumber } from '@/lib/order-number';
import { miriWeekday, miriYmd, ymdToUtcDate } from '@/lib/miri-date';

type StandingItem = {
  menuItemId: string;
  quantity: number;
  notes?: string | null;
};

export async function createStandingOrders(input: {
  weekday: number;
  firstDeliveryYmd: string;
  companyId: string;
  customerId?: string | null;
  employeeName: string;
  employeeEmail: string | null;
  employeePhone: string | null;
  department: string | null;
  deliveryLocation: string;
  deliveryTime: string | null;
  specialInstructions: string | null;
  paymentMethod: 'COMPANY_ACCOUNT' | 'CREDIT_CARD';
  kitchens: { vendorId: string; items: StandingItem[] }[];
}) {
  if (typeof prisma.recurringOrder?.createMany !== 'function') {
    return;
  }

  await prisma.recurringOrder.createMany({
    data: input.kitchens.map((kitchen) => ({
      weekday: input.weekday,
      vendorId: kitchen.vendorId,
      companyId: input.companyId,
      customerId: input.customerId ?? null,
      employeeName: input.employeeName,
      employeeEmail: input.employeeEmail,
      employeePhone: input.employeePhone,
      department: input.department,
      deliveryLocation: input.deliveryLocation,
      deliveryTime: input.deliveryTime,
      specialInstructions: input.specialInstructions,
      paymentMethod: input.paymentMethod,
      items: kitchen.items,
      lastCreatedDate: ymdToUtcDate(input.firstDeliveryYmd),
    })),
  });
}

export async function materializeStandingOrders(vendorId?: string) {
  if (typeof prisma.recurringOrder?.findMany !== 'function') {
    return;
  }

  const today = miriYmd();
  const weekday = miriWeekday();
  const todayDate = ymdToUtcDate(today);

  const standing = await prisma.recurringOrder.findMany({
    where: {
      active: true,
      weekday,
      ...(vendorId ? { vendorId } : {}),
      OR: [{ lastCreatedDate: null }, { lastCreatedDate: { lt: todayDate } }],
    },
  });

  for (const rec of standing) {
    const wanted = rec.items as StandingItem[];
    const ids = wanted.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: await storefrontWhere({
        id: { in: ids },
        vendorId: rec.vendorId,
      }),
    });
    if (menuItems.length === 0) {
      await prisma.recurringOrder.update({
        where: { id: rec.id },
        data: { lastCreatedDate: todayDate },
      });
      continue;
    }

    const qty = new Map(wanted.map((i) => [i.menuItemId, i]));
    const lines = menuItems.map((m) => ({
      menuItemId: m.id,
      quantity: qty.get(m.id)?.quantity ?? 1,
      price: m.price,
      notes: qty.get(m.id)?.notes ?? null,
    }));
    const { subtotal, tax, deliveryFee, total } = calculateTotals(
      lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
    );

    await prisma.$transaction([
      prisma.order.create({
        data: {
          vendorId: rec.vendorId,
          companyId: rec.companyId,
          employeeName: rec.employeeName,
          employeeEmail: rec.employeeEmail,
          employeePhone: rec.employeePhone,
          department: rec.department,
          deliveryLocation: rec.deliveryLocation,
          deliveryDate: todayDate,
          deliveryTime: rec.deliveryTime,
          specialInstructions: rec.specialInstructions,
          paymentMethod: rec.paymentMethod,
          paymentStatus: 'PENDING',
          orderNumber: newOrderNumber(),
          subtotal,
          tax,
          deliveryFee,
          total: toMoney(total),
          items: { create: lines },
        },
      }),
      prisma.recurringOrder.update({
        where: { id: rec.id },
        data: { lastCreatedDate: todayDate },
      }),
    ]);
  }
}
