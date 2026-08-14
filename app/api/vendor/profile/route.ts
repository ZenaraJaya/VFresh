import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizeMyPhone } from '@/lib/phone';
import type { PremisesType } from '@prisma/client';
import { normalizeVendorLogo } from '@/lib/vendor-logo';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.user.id },
  });
  if (!vendor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { password: _password, ...safe } = vendor;
  return NextResponse.json(safe);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const premisesType = body.premisesType
    ? (String(body.premisesType).toUpperCase() as PremisesType)
    : undefined;

  let logo: string | null | undefined;
  try {
    logo =
      body.logo !== undefined ? normalizeVendorLogo(body.logo) : undefined;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid logo' },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.update({
    where: { id: session.user.id },
    data: {
      businessName: body.businessName
        ? String(body.businessName).trim()
        : undefined,
      description:
        body.description !== undefined
          ? String(body.description).trim()
          : undefined,
      phone:
        body.phone !== undefined
          ? normalizeMyPhone(String(body.phone)) ?? ''
          : undefined,
      deliveryPhone:
        body.deliveryPhone !== undefined
          ? normalizeMyPhone(String(body.deliveryPhone)) ?? null
          : undefined,
      address:
        body.address !== undefined
          ? String(body.address).trim()
          : undefined,
      logo,
      registrationNumber:
        body.registrationNumber !== undefined
          ? String(body.registrationNumber).trim() || null
          : undefined,
      premisesType:
        premisesType === 'HOMEBASED' || premisesType === 'OTHER'
          ? premisesType
          : undefined,
    },
  });

  const { password: _password, ...safe } = vendor;
  return NextResponse.json(safe);
}
