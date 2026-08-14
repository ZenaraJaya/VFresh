'use client';

import { useState } from 'react';
import { FIELD } from '@/components/customer/account/ui';

export const JOB_TITLE_PRESETS = [
  'HR',
  'Manager',
  'Admin',
  'Finance',
  'Staff',
] as const;

function isPreset(value: string) {
  return (JOB_TITLE_PRESETS as readonly string[]).includes(value);
}

export default function JobTitleField({
  id,
  label = 'Role at work',
  value,
  onChange,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [otherOpen, setOtherOpen] = useState(
    () => value !== '' && !isPreset(value)
  );
  const showOther = otherOpen || (value !== '' && !isPreset(value));
  const selectValue = isPreset(value) ? value : showOther ? 'Other' : '';

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === 'Other') {
            setOtherOpen(true);
            if (isPreset(value)) onChange('');
          } else {
            setOtherOpen(false);
            onChange(next);
          }
        }}
        className={FIELD}
      >
        <option value="">Select role…</option>
        {JOB_TITLE_PRESETS.map((title) => (
          <option key={title} value={title}>
            {title}
          </option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showOther ? (
        <input
          id={`${id}-other`}
          value={isPreset(value) ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your role"
          className={FIELD}
        />
      ) : null}
    </div>
  );
}
