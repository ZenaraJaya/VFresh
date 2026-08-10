import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  orderId: z.string().min(1)
});

// POST - Create a Stripe PaymentIntent for an existing order.
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  // Card checkout is inert until keys are configured. Fail loudly rather than
  // returning a fake client secret the front end would then try to confirm.
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Card payments are not configured on this deployment' },
      { status: 501 }
    );
  }

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 409 }
      );
    }

    const stripe = new Stripe(secretKey);

    // Amounts are charged from the stored order total, never a client value.
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'myr',
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      automatic_payment_methods: { enabled: true }
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    console.error('POST /api/create-payment-intent failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
