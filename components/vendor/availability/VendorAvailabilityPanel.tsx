'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DAY_KEYS,
  DAY_LABELS,
  defaultWeeklyHours,
  formatVendorSchedule,
  vendorOpenStateLabel,
  type DayHours,
  type ScheduleMode,
  type WeeklyHours,
} from '@/lib/vendor-availability';

function splitLocal(iso: string | null) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function combineLocal(date: string, time: string) {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

type ModeTab = 'EVERYDAY' | 'RANGE' | 'CUSTOM';

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950';

export default function VendorAvailabilityPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [followSchedule, setFollowSchedule] = useState(true);
  const [accepting, setAccepting] = useState(true);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [mode, setMode] = useState<ModeTab>('EVERYDAY');

  // RANGE
  const [closeDate, setCloseDate] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [openTime, setOpenTime] = useState('');

  // EVERYDAY
  const [everydayOpen, setEverydayOpen] = useState('09:00');
  const [everydayClose, setEverydayClose] = useState('18:00');

  // CUSTOM
  const [weekly, setWeekly] = useState<WeeklyHours>(defaultWeeklyHours());
  const [sameTime, setSameTime] = useState(true);
  const [sharedOpen, setSharedOpen] = useState('09:00');
  const [sharedClose, setSharedClose] = useState('18:00');

  const [saved, setSaved] = useState<{
    scheduleMode: ScheduleMode;
    closesAt: string | null;
    closedUntil: string | null;
    openTime: string | null;
    closeTime: string | null;
    weeklyHours: WeeklyHours | null;
  }>({
    scheduleMode: 'NONE',
    closesAt: null,
    closedUntil: null,
    openTime: null,
    closeTime: null,
    weeklyHours: null,
  });

  const applyFromServer = (data: {
    isOpen: boolean;
    followSchedule?: boolean | null;
    accepting?: boolean;
    scheduleMode?: ScheduleMode | string | null;
    closesAt?: string | null;
    closedUntil?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    weeklyHours?: WeeklyHours | null;
  }) => {
    setIsOpen(Boolean(data.isOpen));
    setFollowSchedule(data.followSchedule !== false);

    const state = vendorOpenStateLabel({
      ...data,
      isOpen: Boolean(data.isOpen),
      followSchedule: data.followSchedule !== false,
      status: 'APPROVED',
    });
    setAccepting(
      typeof data.accepting === 'boolean' ? data.accepting : state.accepting
    );
    setStatusDetail(state.detail);

    const scheduleMode = String(
      data.scheduleMode || 'NONE'
    ).toUpperCase() as ScheduleMode;

    setSaved({
      scheduleMode,
      closesAt: data.closesAt ?? null,
      closedUntil: data.closedUntil ?? null,
      openTime: data.openTime ?? null,
      closeTime: data.closeTime ?? null,
      weeklyHours: (data.weeklyHours as WeeklyHours | null) ?? null,
    });

    const closeParts = splitLocal(data.closesAt ?? null);
    const openParts = splitLocal(data.closedUntil ?? null);
    setCloseDate(closeParts.date);
    setCloseTime(closeParts.time);
    setOpenDate(openParts.date);
    setOpenTime(openParts.time);

    if (data.openTime) setEverydayOpen(data.openTime);
    if (data.closeTime) setEverydayClose(data.closeTime);

    if (data.weeklyHours) {
      const next = { ...defaultWeeklyHours(), ...data.weeklyHours };
      setWeekly(next);
      const openDays = DAY_KEYS.map((k) => next[k]).filter(
        (d): d is { open: string; close: string } => !!d
      );
      if (openDays.length > 0) {
        const first = openDays[0];
        setSharedOpen(first.open);
        setSharedClose(first.close);
        const allSame = openDays.every(
          (d) => d.open === first.open && d.close === first.close
        );
        setSameTime(allSame);
      }
    }

    if (scheduleMode === 'RANGE' || scheduleMode === 'EVERYDAY' || scheduleMode === 'CUSTOM') {
      setMode(scheduleMode);
      setScheduleOpen(true);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/availability');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      applyFromServer(data);
    } catch {
      toast.error('Could not load store hours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Fetch current hours once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Update failed');
        return null;
      }
      applyFromServer(data);
      return data;
    } catch {
      toast.error('Update failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const scheduleSummary = formatVendorSchedule(saved);
  const hasSchedule = saved.scheduleMode !== 'NONE';

  const setDayHours = (key: (typeof DAY_KEYS)[number], value: DayHours) => {
    setWeekly((prev) => {
      const next = { ...prev, [key]: value };
      if (sameTime && value) {
        for (const k of DAY_KEYS) {
          if (next[k]) next[k] = { open: value.open, close: value.close };
        }
      }
      return next;
    });
  };

  const applySharedTimes = (open: string, close: string) => {
    setSharedOpen(open);
    setSharedClose(close);
    setWeekly((prev) => {
      const next = { ...prev };
      for (const k of DAY_KEYS) {
        if (next[k]) next[k] = { open, close };
      }
      return next;
    });
  };

  const saveSchedule = async () => {
    if (mode === 'EVERYDAY') {
      if (!everydayOpen || !everydayClose) {
        toast.error('Set open and close times');
        return;
      }
      const data = await patch({
        scheduleMode: 'EVERYDAY',
        openTime: everydayOpen,
        closeTime: everydayClose,
        isOpen: true,
      });
      if (data) toast.success('Everyday hours saved');
      return;
    }

    if (mode === 'RANGE') {
      const closeAt = combineLocal(closeDate, closeTime);
      const openAt = combineLocal(openDate, openTime);
      if (!closeAt) {
        toast.error('Set when to close first');
        return;
      }
      if (!openAt) {
        toast.error('Set when to open again');
        return;
      }
      if (closeAt.getTime() >= openAt.getTime()) {
        toast.error('Open again must be after close');
        return;
      }
      const data = await patch({
        scheduleMode: 'RANGE',
        closesAt: closeAt.toISOString(),
        closedUntil: openAt.toISOString(),
      });
      if (data) toast.success('Date range saved');
      return;
    }

    // Always sync shared times onto open days before save (unless per-day override)
    const hoursToSave = sameTime
      ? Object.fromEntries(
          DAY_KEYS.map((k) => [
            k,
            weekly[k] ? { open: sharedOpen, close: sharedClose } : null,
          ])
        )
      : weekly;

    const data = await patch({
      scheduleMode: 'CUSTOM',
      weeklyHours: hoursToSave,
      isOpen: true,
    });
    if (data) toast.success('Custom hours saved');
  };

  if (loading) {
    return (
      <div className="flex justify-center rounded-2xl border border-neutral-200 bg-white py-10 dark:border-neutral-800 dark:bg-neutral-900">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Store availability</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Open / Close works now. Hours stay saved until you Reset.
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              accepting
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            {accepting ? 'Open now' : 'Closed now'}
          </span>
          {statusDetail && (
            <p className="mt-1 text-xs text-neutral-500">{statusDetail}</p>
          )}
        </div>
      </div>

      {scheduleSummary && (
        <p className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
          {scheduleSummary}
          {!followSchedule && (
            <span className="mt-1 block text-xs text-neutral-500">
              Manual override on — Save hours again to follow schedule
            </span>
          )}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            const data = await patch({ isOpen: true });
            if (data) toast.success('Open now (manual)');
          }}
          className={`rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
            accepting
              ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-neutral-900'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
          }`}
        >
          Open
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            const data = await patch({ isOpen: false });
            if (data) toast.success('Closed now (manual)');
          }}
          className={`rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
            !accepting
              ? 'bg-amber-500 text-white ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-neutral-900'
              : 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
          }`}
        >
          Close
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setScheduleOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 bg-neutral-50 px-4 py-3 text-left transition hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-900"
          aria-expanded={scheduleOpen}
        >
          <div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              Opening hours
            </p>
            <p className="text-xs text-neutral-500">
              {scheduleSummary || 'Everyday, date range, or custom by day'}
            </p>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-400 transition ${
              scheduleOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {scheduleOpen && (
          <div className="space-y-4 border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['EVERYDAY', 'Everyday'],
                  ['RANGE', 'Close → Open'],
                  ['CUSTOM', 'Custom'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    mode === value
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'EVERYDAY' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">
                    Open at
                  </label>
                  <input
                    type="time"
                    value={everydayOpen}
                    onChange={(e) => setEverydayOpen(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">
                    Close at
                  </label>
                  <input
                    type="time"
                    value={everydayClose}
                    onChange={(e) => setEverydayClose(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {mode === 'RANGE' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Closed period can be one day or many — set when it starts
                  (close), then when it ends (open again). Example: close Fri
                  6pm → open Mon 9am.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      1. Close from
                    </p>
                    <input
                      type="date"
                      value={closeDate}
                      onChange={(e) => {
                        setCloseDate(e.target.value);
                        if (!closeTime) setCloseTime('18:00');
                      }}
                      aria-label="Close date"
                      className={inputClass}
                    />
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      aria-label="Close time"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                      2. Open again on
                    </p>
                    <input
                      type="date"
                      value={openDate}
                      min={closeDate || undefined}
                      onChange={(e) => {
                        setOpenDate(e.target.value);
                        if (!openTime) setOpenTime('09:00');
                      }}
                      aria-label="Open date"
                      className={inputClass}
                    />
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      aria-label="Open time"
                      className={inputClass}
                    />
                  </div>
                </div>
                {closeDate && openDate && (
                  <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
                    {(() => {
                      const start = combineLocal(
                        closeDate,
                        closeTime || '18:00'
                      );
                      const end = combineLocal(openDate, openTime || '09:00');
                      if (!start || !end || end <= start) {
                        return 'Open again must be after close.';
                      }
                      const days = Math.max(
                        1,
                        Math.ceil(
                          (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
                        )
                      );
                      return `Store stays closed across ~${days} day${days === 1 ? '' : 's'} until reopen.`;
                    })()}
                  </p>
                )}
              </div>
            )}

            {mode === 'CUSTOM' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Pick open days, then set open &amp; close once.
                </p>

                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-500">
                    Open days
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_KEYS.map((key, i) => {
                      const enabled =
                        weekly[key] !== null && weekly[key] !== undefined;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setDayHours(
                              key,
                              enabled
                                ? null
                                : { open: sharedOpen, close: sharedClose }
                            )
                          }
                          className={`min-w-[2.75rem] rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                            enabled
                              ? 'bg-emerald-500 text-white'
                              : 'border border-neutral-200 bg-white text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950'
                          }`}
                        >
                          {DAY_LABELS[i]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">
                      Open
                    </label>
                    <input
                      type="time"
                      value={sharedOpen}
                      onChange={(e) =>
                        applySharedTimes(e.target.value, sharedClose)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">
                      Close
                    </label>
                    <input
                      type="time"
                      value={sharedClose}
                      onChange={(e) =>
                        applySharedTimes(sharedOpen, e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    Different times per day (optional)
                  </summary>
                  <div className="space-y-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
                    {DAY_KEYS.map((key, i) => {
                      const day = weekly[key];
                      if (!day) return null;
                      return (
                        <div
                          key={key}
                          className="grid items-center gap-2 sm:grid-cols-[3rem_1fr_1fr]"
                        >
                          <span className="text-xs font-semibold text-neutral-600">
                            {DAY_LABELS[i]}
                          </span>
                          <input
                            type="time"
                            value={day.open}
                            onChange={(e) => {
                              setSameTime(false);
                              setWeekly((prev) => ({
                                ...prev,
                                [key]: { open: e.target.value, close: day.close },
                              }));
                            }}
                            className={inputClass}
                          />
                          <input
                            type="time"
                            value={day.close}
                            onChange={(e) => {
                              setSameTime(false);
                              setWeekly((prev) => ({
                                ...prev,
                                [key]: { open: day.open, close: e.target.value },
                              }));
                            }}
                            className={inputClass}
                          />
                        </div>
                      );
                    })}
                    {DAY_KEYS.every((k) => !weekly[k]) && (
                      <p className="text-xs text-neutral-500">
                        Select at least one open day above.
                      </p>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={saveSchedule}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              {hasSchedule && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const data = await patch({
                      isOpen,
                      clearSchedule: true,
                    });
                    if (data) toast.success('Schedule reset');
                  }}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
