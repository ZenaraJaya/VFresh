'use client';

import { Check } from 'lucide-react';
import { useOrderLive } from '@/lib/use-order-live';

const STEPS = [
  { key: 'PENDING', label: 'Receive' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY', label: 'Ready' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the way' },
  { key: 'DELIVERED', label: 'Complete' },
] as const;

const RANK: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  PREPARING: 1,
  READY: 2,
  HEADING_TO_VENDOR: 3,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

export default function OrderProgress({
  orderNumber,
  initialStatus,
  initialStockDeducted = false,
}: {
  orderNumber: string;
  initialStatus: string;
  initialStockDeducted?: boolean;
}) {
  const { status } = useOrderLive(orderNumber, {
    status: initialStatus,
    stockDeducted: initialStockDeducted,
  });

  if (status === 'CANCELLED') {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        This order was cancelled.
      </p>
    );
  }

  const current = RANK[status] ?? 0;
  const last = STEPS.length - 1;
  const fill = last === 0 ? 0 : (current / last) * 100;

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <ol className="relative mx-auto min-w-[18.5rem] max-w-2xl px-2 pt-1 sm:min-w-0">
        <div
          className="pointer-events-none absolute left-[10%] right-[10%] top-[13px] h-0.5 bg-neutral-200 sm:top-[15px] dark:bg-neutral-800"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-[10%] top-[13px] h-0.5 bg-emerald-500 transition-all duration-500 sm:top-[15px]"
          style={{ width: `calc(${fill} * 0.8%)` }}
          aria-hidden
        />
        <div className="relative grid grid-cols-5">
          {STEPS.map((step, i) => {
            const done = current > i;
            const here = current === i;
            const reached = current >= i;
            return (
              <li
                key={step.key}
                className="flex min-w-0 flex-col items-center px-0.5 text-center"
              >
                <span
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold sm:h-8 sm:w-8 sm:text-xs ${
                    here
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.25)]'
                      : done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-neutral-200 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900'
                  }`}
                >
                  {done || (here && i === last) ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`mt-1.5 w-full text-[10px] leading-tight font-semibold sm:mt-2 sm:text-xs ${
                    here
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : reached
                        ? 'text-neutral-800 dark:text-neutral-200'
                        : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </div>
      </ol>
    </div>
  );
}
