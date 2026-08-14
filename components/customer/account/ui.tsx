import type { ReactNode } from 'react';

export const FIELD =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-950';

export function StatusBadge({
  tone,
  children,
}: {
  tone: 'neutral' | 'success' | 'warn' | 'danger' | 'info';
  children: ReactNode;
}) {
  const cls = {
    neutral:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    success:
      'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    warn: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    danger: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
    info: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  }[tone];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export function invoiceTone(status: string) {
  if (status === 'PAID') return 'success' as const;
  if (status === 'OVERDUE') return 'danger' as const;
  if (status === 'SENT') return 'warn' as const;
  return 'neutral' as const;
}

export function orderTone(status: string) {
  if (status === 'DELIVERED') return 'success' as const;
  if (status === 'CANCELLED') return 'danger' as const;
  if (status === 'READY' || status === 'PREPARING' || status === 'HEADING_TO_VENDOR' || status === 'OUT_FOR_DELIVERY') return 'info' as const;
  return 'warn' as const;
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center dark:border-neutral-700 dark:bg-neutral-900">
      <p className="font-medium text-neutral-800 dark:text-neutral-100">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">{body}</p>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function PageIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        {title}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </header>
  );
}
