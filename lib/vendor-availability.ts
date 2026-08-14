export type ScheduleMode = 'NONE' | 'RANGE' | 'EVERYDAY' | 'CUSTOM';

export type DayHours = { open: string; close: string } | null;

export type WeeklyHours = Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', DayHours>>;

export type VendorHours = {
  isOpen?: boolean;
  followSchedule?: boolean | null;
  scheduleMode?: ScheduleMode | string | null;
  closesAt?: Date | string | null;
  closedUntil?: Date | string | null;
  openTime?: string | null;
  closeTime?: string | null;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  weeklyHours?: WeeklyHours | unknown | null;
  status?: string;
};

export const DAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const;
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const VENDOR_HOURS_SELECT = {
  isOpen: true,
  followSchedule: true,
  scheduleMode: true,
  closesAt: true,
  closedUntil: true,
  openTime: true,
  closeTime: true,
  lunchStart: true,
  lunchEnd: true,
  weeklyHours: true,
} as const;

export const VENDOR_PUBLIC_SELECT = {
  id: true,
  businessName: true,
  slug: true,
  description: true,
  logo: true,
  phone: true,
  address: true,
  ...VENDOR_HOURS_SELECT,
  _count: { select: { menuItems: { where: { available: true } } } },
} as const;

function asDate(value?: Date | string | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseHm(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatHmLabel(hm: string) {
  const mins = parseHm(hm);
  if (mins == null) return hm;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function lunchWindow(vendor: {
  lunchStart?: string | null;
  lunchEnd?: string | null;
}): { start: string; end: string } | null {
  const start = vendor.lunchStart?.trim() || '';
  const end = vendor.lunchEnd?.trim() || '';
  if (!start || !end) return null;
  const s = parseHm(start);
  const e = parseHm(end);
  if (s == null || e == null || s === e) return null;
  return { start, end };
}

export function isVendorOnLunchBreak(vendor: VendorHours, now = new Date()) {
  if (vendor.followSchedule === false) return false;
  const lunch = lunchWindow(vendor);
  if (!lunch) return false;
  return isWithinDailyWindow(now, lunch.start, lunch.end);
}

export function formatLunchLabel(vendor: {
  lunchStart?: string | null;
  lunchEnd?: string | null;
}) {
  const lunch = lunchWindow(vendor);
  if (!lunch) return null;
  return `Lunch ${formatHmLabel(lunch.start)}–${formatHmLabel(lunch.end)}`;
}

export function vendorOpenBadge(vendor: VendorHours): 'Open' | 'Lunch' | 'Closed' {
  if (isVendorAcceptingOrders({ ...vendor, status: 'APPROVED' })) return 'Open';
  if (isVendorOnLunchBreak(vendor)) return 'Lunch';
  return 'Closed';
}

export function vendorPauseMessage(vendor: VendorHours) {
  if (isVendorOnLunchBreak(vendor)) {
    const lunch = formatLunchLabel(vendor);
    return lunch
      ? `${lunch} — not taking orders right now`
      : 'This vendor is on lunch break';
  }
  return 'This vendor is temporarily closed';
}

function withLunchPause(vendor: VendorHours, otherwiseOpen: boolean, now: Date) {
  if (!otherwiseOpen) return false;
  if (isVendorOnLunchBreak(vendor, now)) return false;
  return true;
}

export function isWithinDailyWindow(
  now: Date,
  open: string,
  close: string
): boolean {
  const mins = now.getHours() * 60 + now.getMinutes();
  const o = parseHm(open);
  const c = parseHm(close);
  if (o == null || c == null) return false;
  if (o === c) return true; // 24h
  if (o < c) return mins >= o && mins < c;
  // Overnight (e.g. 22:00–06:00)
  return mins >= o || mins < c;
}

export function asWeeklyHours(value: unknown): WeeklyHours | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: WeeklyHours = {};
  let any = false;
  for (const key of DAY_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (raw === null) {
      out[key] = null;
      any = true;
      continue;
    }
    if (
      raw &&
      typeof raw === 'object' &&
      typeof (raw as { open?: unknown }).open === 'string' &&
      typeof (raw as { close?: unknown }).close === 'string' &&
      parseHm((raw as { open: string }).open) != null &&
      parseHm((raw as { close: string }).close) != null
    ) {
      out[key] = {
        open: (raw as { open: string }).open,
        close: (raw as { close: string }).close,
      };
      any = true;
    }
  }
  return any ? out : null;
}

function resolveMode(vendor: VendorHours): ScheduleMode {
  const mode = String(vendor.scheduleMode || 'NONE').toUpperCase();
  if (mode === 'RANGE' || mode === 'EVERYDAY' || mode === 'CUSTOM') {
    return mode;
  }
  // Legacy: times without mode
  if (vendor.closesAt || vendor.closedUntil) return 'RANGE';
  if (vendor.openTime && vendor.closeTime) return 'EVERYDAY';
  if (asWeeklyHours(vendor.weeklyHours)) return 'CUSTOM';
  return 'NONE';
}

/**
 * Effective accepting-orders state.
 * - Manual Open/Close (followSchedule=false): isOpen wins, schedule ignored.
 * - Following schedule (followSchedule=true): hours / date range decide.
 */
export function isVendorAcceptingOrders(vendor: VendorHours) {
  if (vendor.status && vendor.status !== 'APPROVED') return false;

  const follow = vendor.followSchedule !== false;
  if (!follow) return Boolean(vendor.isOpen);

  const mode = resolveMode(vendor);
  const now = new Date();

  if (mode === 'NONE') return Boolean(vendor.isOpen);

  if (mode === 'RANGE') {
    const closesAt = asDate(vendor.closesAt);
    const opensAt = asDate(vendor.closedUntil);
    const t = now.getTime();

    if (closesAt && opensAt && closesAt.getTime() < opensAt.getTime()) {
      if (t >= closesAt.getTime() && t < opensAt.getTime()) return false;
      return true;
    }
    if (!closesAt && opensAt) {
      return t >= opensAt.getTime();
    }
    if (closesAt && !opensAt) {
      return t < closesAt.getTime();
    }
    return Boolean(vendor.isOpen);
  }

  if (mode === 'EVERYDAY') {
    if (!vendor.openTime || !vendor.closeTime) return Boolean(vendor.isOpen);
    return withLunchPause(
      vendor,
      isWithinDailyWindow(now, vendor.openTime, vendor.closeTime),
      now
    );
  }

  if (mode === 'CUSTOM') {
    const weekly = asWeeklyHours(vendor.weeklyHours);
    if (!weekly) return Boolean(vendor.isOpen);
    const key = String(now.getDay()) as (typeof DAY_KEYS)[number];
    const day = weekly[key];
    if (day === undefined) return Boolean(vendor.isOpen);
    if (day === null) return false;
    return withLunchPause(
      vendor,
      isWithinDailyWindow(now, day.open, day.close),
      now
    );
  }

  return Boolean(vendor.isOpen);
}

/** Short reason for the vendor dashboard badge. */
export function vendorOpenStateLabel(vendor: VendorHours): {
  accepting: boolean;
  label: string;
  detail: string | null;
} {
  const accepting = isVendorAcceptingOrders({ ...vendor, status: 'APPROVED' });
  const follow = vendor.followSchedule !== false;
  const mode = resolveMode(vendor);
  const lunch = formatLunchLabel(vendor);

  if (accepting) {
    if (!follow) return { accepting: true, label: 'Open now', detail: 'Manual open' };
    return { accepting: true, label: 'Open now', detail: lunch };
  }

  if (follow && isVendorOnLunchBreak(vendor)) {
    return {
      accepting: false,
      label: 'Lunch break',
      detail: lunch,
    };
  }

  if (!follow && !vendor.isOpen) {
    return { accepting: false, label: 'Closed now', detail: 'Manual close' };
  }

  if (mode === 'CUSTOM') {
    const weekly = asWeeklyHours(vendor.weeklyHours);
    const key = String(new Date().getDay()) as (typeof DAY_KEYS)[number];
    const day = weekly?.[key];
    if (day === null) {
      return {
        accepting: false,
        label: 'Closed now',
        detail: `Closed ${DAY_LABELS[Number(key)]}`,
      };
    }
    if (day) {
      return {
        accepting: false,
        label: 'Closed now',
        detail: `Hours ${formatHmLabel(day.open)}–${formatHmLabel(day.close)}`,
      };
    }
  }

  if (mode === 'EVERYDAY' && vendor.openTime && vendor.closeTime) {
    return {
      accepting: false,
      label: 'Closed now',
      detail: `Hours ${formatHmLabel(vendor.openTime)}–${formatHmLabel(vendor.closeTime)}`,
    };
  }

  if (mode === 'RANGE') {
    const opensAt = asDate(vendor.closedUntil);
    if (opensAt && opensAt.getTime() > Date.now()) {
      return {
        accepting: false,
        label: 'Closed now',
        detail: `Until ${shortDateTime(opensAt)}`,
      };
    }
  }

  return { accepting: false, label: 'Closed now', detail: null };
}

export function vendorClosedLabel(vendor: VendorHours) {
  if (isVendorAcceptingOrders({ ...vendor, status: 'APPROVED' })) {
    return null;
  }

  if (
    vendor.followSchedule !== false &&
    isVendorOnLunchBreak(vendor)
  ) {
    const lunch = formatLunchLabel(vendor);
    return lunch
      ? `${lunch} · not taking orders`
      : 'Lunch break · not taking orders';
  }

  const mode = resolveMode(vendor);
  if (!vendor.followSchedule && !vendor.isOpen) {
    return 'Temporarily closed · not taking orders';
  }

  if (mode === 'RANGE') {
    const opensAt = asDate(vendor.closedUntil);
    if (opensAt && opensAt.getTime() > Date.now()) {
      return `Temporarily closed · reopens ${shortDateTime(opensAt)}`;
    }
  }

  if (mode === 'EVERYDAY' && vendor.openTime && vendor.closeTime) {
    return `Closed · open ${formatHmLabel(vendor.openTime)}–${formatHmLabel(vendor.closeTime)} daily`;
  }

  if (mode === 'CUSTOM') {
    const weekly = asWeeklyHours(vendor.weeklyHours);
    if (weekly) {
      const key = String(new Date().getDay()) as (typeof DAY_KEYS)[number];
      const day = weekly[key];
      if (day === null) return `Closed today (${DAY_LABELS[Number(key)]})`;
      if (day) {
        return `Closed · open ${formatHmLabel(day.open)}–${formatHmLabel(day.close)} today`;
      }
    }
  }

  return 'Temporarily closed · not taking orders';
}

function shortDateTime(d: Date) {
  return d.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Group day indexes into "Mon–Fri, Sun" style labels. */
function formatDayGroups(indexes: number[]): string {
  if (indexes.length === 0) return '';
  const sorted = [...indexes].sort((a, b) => a - b);
  const groups: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  const flush = (from: number, to: number) => {
    if (from === to) groups.push(DAY_LABELS[from]);
    else if (to === from + 1) {
      groups.push(DAY_LABELS[from], DAY_LABELS[to]);
    } else {
      groups.push(`${DAY_LABELS[from]}–${DAY_LABELS[to]}`);
    }
  };

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    flush(start, prev);
    start = sorted[i];
    prev = sorted[i];
  }
  flush(start, prev);
  return groups.join(', ');
}

export function formatVendorSchedule(vendor: {
  scheduleMode?: ScheduleMode | string | null;
  closesAt?: Date | string | null;
  closedUntil?: Date | string | null;
  openTime?: string | null;
  closeTime?: string | null;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  weeklyHours?: WeeklyHours | unknown | null;
}) {
  const mode = resolveMode({ isOpen: true, ...vendor });
  const lunch = formatLunchLabel(vendor);
  const withLunch = (hours: string) => (lunch ? `${hours} · ${lunch}` : hours);

  if (mode === 'EVERYDAY' && vendor.openTime && vendor.closeTime) {
    return withLunch(
      `Daily ${formatHmLabel(vendor.openTime)}–${formatHmLabel(vendor.closeTime)}`
    );
  }

  if (mode === 'CUSTOM') {
    const weekly = asWeeklyHours(vendor.weeklyHours);
    if (!weekly) return null;

    const openEntries = DAY_KEYS.map((key, i) => {
      const day = weekly[key];
      if (!day) return null;
      return { i, open: day.open, close: day.close };
    }).filter(Boolean) as { i: number; open: string; close: string }[];

    if (openEntries.length === 0) return 'Custom · all days closed';

    const sameHours = openEntries.every(
      (e) =>
        e.open === openEntries[0].open && e.close === openEntries[0].close
    );

    if (sameHours) {
      const days = formatDayGroups(openEntries.map((e) => e.i));
      const hours = `${formatHmLabel(openEntries[0].open)}–${formatHmLabel(openEntries[0].close)}`;
      return withLunch(`${days} · ${hours}`);
    }

    // Different hours: only list open days
    return withLunch(
      openEntries
        .map(
          (e) =>
            `${DAY_LABELS[e.i]} ${formatHmLabel(e.open)}–${formatHmLabel(e.close)}`
        )
        .join(' · ')
    );
  }

  if (mode === 'RANGE') {
    const closesAt = asDate(vendor.closesAt);
    const opensAt = asDate(vendor.closedUntil);
    if (closesAt && opensAt) {
      return `Closed ${shortDateTime(closesAt)} → ${shortDateTime(opensAt)}`;
    }
    if (closesAt) return `Closes ${shortDateTime(closesAt)}`;
    if (opensAt) return `Opens ${shortDateTime(opensAt)}`;
    return null;
  }

  return null;
}

/** Open vendors first; closed ones sink to the bottom. */
export function sortVendorsOpenFirst<T extends VendorHours>(vendors: T[]): T[] {
  return [...vendors].sort((a, b) => {
    const aOpen = isVendorAcceptingOrders({
      ...a,
      status: a.status ?? 'APPROVED',
    });
    const bOpen = isVendorAcceptingOrders({
      ...b,
      status: b.status ?? 'APPROVED',
    });
    if (aOpen === bOpen) return 0;
    return aOpen ? -1 : 1;
  });
}

/** Menu from open vendors first; closed-vendor dishes go last. */
export function sortMenuOpenFirst<
  T extends { vendor?: VendorHours | null },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aOpen = a.vendor
      ? isVendorAcceptingOrders({ ...a.vendor, status: 'APPROVED' })
      : true;
    const bOpen = b.vendor
      ? isVendorAcceptingOrders({ ...b.vendor, status: 'APPROVED' })
      : true;
    if (aOpen === bOpen) return 0;
    return aOpen ? -1 : 1;
  });
}

export function isMenuFromOpenVendor(item: {
  vendor?: VendorHours | null;
}): boolean {
  if (!item.vendor) return true;
  return isVendorAcceptingOrders({ ...item.vendor, status: 'APPROVED' });
}

export function defaultWeeklyHours(): WeeklyHours {
  const hours: WeeklyHours = {};
  for (const key of DAY_KEYS) {
    // Closed Sun by default; Mon–Sat 09:00–18:00
    hours[key] = key === '0' ? null : { open: '09:00', close: '18:00' };
  }
  return hours;
}
