import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  asWeeklyHours,
  DAY_KEYS,
  isVendorAcceptingOrders,
  parseHm,
  type ScheduleMode,
  type WeeklyHours,
  VENDOR_HOURS_SELECT,
} from '@/lib/vendor-availability';

export const dynamic = 'force-dynamic';

async function requireApprovedVendor() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return null;
  }
  return session;
}

function parseOptionalDate(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return { value: null as Date | null };
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return { error: `Invalid ${label}.` };
  }
  return { value: parsed };
}

function parseTime(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return { error: `${label} is required.` };
  }
  const raw = String(value).trim();
  if (parseHm(raw) == null) {
    return { error: `Invalid ${label}. Use HH:mm.` };
  }
  return { value: raw };
}

function parseLunchPair(start: unknown, end: unknown) {
  const s =
    start === null || start === undefined || start === ''
      ? ''
      : String(start).trim();
  const e =
    end === null || end === undefined || end === ''
      ? ''
      : String(end).trim();
  if (!s && !e) return { start: null as string | null, end: null as string | null };
  if (!s || !e) {
    return { error: 'Set both lunch start and end, or leave lunch empty.' };
  }
  if (parseHm(s) == null || parseHm(e) == null) {
    return { error: 'Invalid lunch time. Use HH:mm.' };
  }
  if ((parseHm(s) as number) >= (parseHm(e) as number)) {
    return { error: 'Lunch end must be after lunch start.' };
  }
  return { start: s, end: e };
}

function parseWeekly(value: unknown) {
  const weekly = asWeeklyHours(value);
  if (!weekly) {
    return { error: 'Set hours for at least one day.' };
  }
  let hasOpenDay = false;
  for (const key of DAY_KEYS) {
    if (weekly[key] && weekly[key] !== null) hasOpenDay = true;
  }
  if (!hasOpenDay) {
    return { error: 'At least one day must be open.' };
  }
  return { value: weekly as WeeklyHours };
}

export async function GET() {
  const session = await requireApprovedVendor();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.user.id },
    select: {
      ...VENDOR_HOURS_SELECT,
      businessName: true,
      status: true,
    },
  });

  return NextResponse.json({
    ...vendor,
    accepting: vendor
      ? isVendorAcceptingOrders({
          ...vendor,
          status: vendor.status,
          weeklyHours: vendor.weeklyHours as WeeklyHours | null,
        })
      : false,
  });
}

export async function PATCH(req: Request) {
  const session = await requireApprovedVendor();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const clearSchedule = Boolean(body.clearSchedule);
  const hasMode = body.scheduleMode !== undefined;
  const modeRaw = String(body.scheduleMode || 'NONE').toUpperCase() as ScheduleMode;
  const savingSchedule =
    hasMode &&
    (modeRaw === 'RANGE' || modeRaw === 'EVERYDAY' || modeRaw === 'CUSTOM');

  let isOpen = body.isOpen !== undefined ? Boolean(body.isOpen) : undefined;

  let scheduleMode: ScheduleMode | undefined;
  let closesAt: Date | null | undefined;
  let closedUntil: Date | null | undefined;
  let openTime: string | null | undefined;
  let closeTime: string | null | undefined;
  let lunchStart: string | null | undefined;
  let lunchEnd: string | null | undefined;
  let weeklyHours: WeeklyHours | null | undefined;

  let followSchedule: boolean | undefined;

  if (clearSchedule) {
    scheduleMode = 'NONE';
    closesAt = null;
    closedUntil = null;
    openTime = null;
    closeTime = null;
    lunchStart = null;
    lunchEnd = null;
    weeklyHours = null;
    followSchedule = true;
    if (isOpen === undefined) isOpen = true;
  } else if (savingSchedule) {
    followSchedule = true;
    if (modeRaw === 'RANGE') {
      const closeParsed = parseOptionalDate(body.closesAt, 'close time');
      if (closeParsed.error) {
        return NextResponse.json({ error: closeParsed.error }, { status: 400 });
      }
      const openParsed = parseOptionalDate(body.closedUntil, 'open time');
      if (openParsed.error) {
        return NextResponse.json({ error: openParsed.error }, { status: 400 });
      }
      if (!closeParsed.value || !openParsed.value) {
        return NextResponse.json(
          { error: 'Set close first, then when to open again.' },
          { status: 400 }
        );
      }
      if (closeParsed.value.getTime() >= openParsed.value.getTime()) {
        return NextResponse.json(
          { error: 'Open again must be after close.' },
          { status: 400 }
        );
      }

      scheduleMode = 'RANGE';
      closesAt = closeParsed.value;
      closedUntil = openParsed.value;
      openTime = null;
      closeTime = null;
      weeklyHours = null;

      const now = Date.now();
      isOpen = !(now >= closesAt.getTime() && now < closedUntil.getTime());
    } else if (modeRaw === 'EVERYDAY') {
      const openParsed = parseTime(body.openTime, 'Open time');
      if (openParsed.error) {
        return NextResponse.json({ error: openParsed.error }, { status: 400 });
      }
      const closeParsed = parseTime(body.closeTime, 'Close time');
      if (closeParsed.error) {
        return NextResponse.json({ error: closeParsed.error }, { status: 400 });
      }

      scheduleMode = 'EVERYDAY';
      openTime = openParsed.value!;
      closeTime = closeParsed.value!;
      closesAt = null;
      closedUntil = null;
      weeklyHours = null;
      isOpen = true;

      const lunch = parseLunchPair(body.lunchStart, body.lunchEnd);
      if ('error' in lunch && lunch.error) {
        return NextResponse.json({ error: lunch.error }, { status: 400 });
      }
      lunchStart = lunch.start ?? null;
      lunchEnd = lunch.end ?? null;
    } else {
      const weeklyParsed = parseWeekly(body.weeklyHours);
      if (weeklyParsed.error) {
        return NextResponse.json({ error: weeklyParsed.error }, { status: 400 });
      }

      scheduleMode = 'CUSTOM';
      weeklyHours = weeklyParsed.value!;
      closesAt = null;
      closedUntil = null;
      openTime = null;
      closeTime = null;
      isOpen = true;

      const lunch = parseLunchPair(body.lunchStart, body.lunchEnd);
      if ('error' in lunch && lunch.error) {
        return NextResponse.json({ error: lunch.error }, { status: 400 });
      }
      lunchStart = lunch.start ?? null;
      lunchEnd = lunch.end ?? null;
    }
  } else if (body.isOpen !== undefined) {
    // Manual open/close: schedule kept, but override until Save hours again
    isOpen = Boolean(body.isOpen);
    followSchedule = false;
  } else {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const vendor = await prisma.vendor.update({
    where: { id: session.user.id },
    data: {
      ...(isOpen !== undefined ? { isOpen } : {}),
      ...(followSchedule !== undefined ? { followSchedule } : {}),
      ...(scheduleMode !== undefined ? { scheduleMode } : {}),
      ...(closesAt !== undefined ? { closesAt } : {}),
      ...(closedUntil !== undefined ? { closedUntil } : {}),
      ...(openTime !== undefined ? { openTime } : {}),
      ...(closeTime !== undefined ? { closeTime } : {}),
      ...(lunchStart !== undefined ? { lunchStart } : {}),
      ...(lunchEnd !== undefined ? { lunchEnd } : {}),
      ...(weeklyHours !== undefined
        ? {
            weeklyHours:
              weeklyHours === null
                ? Prisma.DbNull
                : (weeklyHours as Prisma.InputJsonValue),
          }
        : {}),
    },
    select: {
      id: true,
      businessName: true,
      ...VENDOR_HOURS_SELECT,
    },
  });

  const accepting = isVendorAcceptingOrders({
    ...vendor,
    status: 'APPROVED',
    weeklyHours: vendor.weeklyHours as WeeklyHours | null,
  });

  return NextResponse.json({
    ...vendor,
    accepting,
  });
}
