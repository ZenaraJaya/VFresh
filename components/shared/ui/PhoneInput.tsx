'use client';

import { composeMyPhone, toLocalDigits } from '@/lib/phone';

const WRAP =
  'flex w-full overflow-hidden rounded-xl border border-neutral-200 bg-white transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-950';

export default function PhoneInput({
  id,
  value,
  onChange,
  required,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (full: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const local = toLocalDigits(value);

  return (
    <div className={`${WRAP} ${className ?? ''}`}>
      <span className="flex shrink-0 items-center border-r border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
        +60
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        value={local}
        onChange={(e) => onChange(composeMyPhone(e.target.value))}
        pattern={required ? '\\d+' : undefined}
        title={required ? 'Enter a phone number' : undefined}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
      />
    </div>
  );
}
