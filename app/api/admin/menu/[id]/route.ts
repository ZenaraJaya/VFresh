import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { menuRejectEmail, sendEmail } from '@/lib/email';
import { Prisma } from '@prisma/client';

// Next 16 removed synchronous access to route `params` — it is always a Promise.
type RouteContext = { params: Promise<{ id: string }> };

// PUT - Update menu item
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image: data.image,
        badges: data.badges,
        available: data.available
      }
    });

    return NextResponse.json(menuItem);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const action = String(body.action ?? '');
    const reason = String(body.reason ?? '').trim();

    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        vendor: { select: { email: true, businessName: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { error: 'Give a reason for removing this dish.' },
          { status: 400 }
        );
      }
      await prisma.menuItem.update({
        where: { id },
        data: { available: false },
      });
      await prisma.$executeRaw(Prisma.sql`
        UPDATE menu_items
        SET "reviewStatus" = CAST('REJECTED' AS "MenuReviewStatus"),
            "rejectReason" = ${reason}
        WHERE id = ${id}
      `);
      if (existing.vendor?.email) {
        const mail = menuRejectEmail({
          businessName: existing.vendor.businessName,
          dishName: existing.name,
          reason,
        });
        await sendEmail({
          to: existing.vendor.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
      }
      return NextResponse.json({
        ...existing,
        available: false,
        reviewStatus: 'REJECTED',
        rejectReason: reason,
      });
    }

    if (action === 'restore') {
      await prisma.menuItem.update({
        where: { id },
        data: { available: true },
      });
      await prisma.$executeRaw(Prisma.sql`
        UPDATE menu_items
        SET "reviewStatus" = CAST('LIVE' AS "MenuReviewStatus"),
            "rejectReason" = NULL
        WHERE id = ${id}
      `);
      return NextResponse.json({
        ...existing,
        available: true,
        reviewStatus: 'LIVE',
        rejectReason: null,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to review menu item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu item
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.menuItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
