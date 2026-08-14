import { NextResponse } from 'next/server';
import { findActiveInvite } from '@/lib/company-invite';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { token } = await params;
  const invite = await findActiveInvite(token);
  if (!invite) {
    return NextResponse.json(
      { error: 'This staff link is invalid or has been revoked.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    company: { id: invite.company.id, name: invite.company.name },
  });
}
