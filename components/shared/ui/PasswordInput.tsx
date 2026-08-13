'use client';

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { isValidPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-rules';
import RequiredMark from '@/components/shared/ui/RequiredMark';

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  showRule?: boolean;
  placeholder?: string;
  leftIcon?: ReactNode;
};

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  required,
  showRule = false,
  placeholder = '••••••••',
  leftIcon,
}: Props) {
  const [show, setShow] = useState(false);
  const showHint = showRule && value.length > 0 && !isValidPassword(value);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required={required}
          minLength={showRule ? MIN_PASSWORD_LENGTH : undefined}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-neutral-200 bg-white py-2.5 pr-11 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950 ${
            leftIcon ? 'pl-10' : 'pl-3'
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showRule && (
        <p className={`text-xs ${showHint ? 'text-amber-600' : 'text-neutral-500'}`}>
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      )}
    </div>
  );
}
