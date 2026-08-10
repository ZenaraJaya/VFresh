'use client';

import { Building2, CreditCard } from 'lucide-react';
import type { PaymentMethod } from '@/types';

interface PaymentFormProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

/**
 * Card payment is deliberately inert: no Stripe keys are configured, so
 * offering it would produce orders that can never be captured. The option is
 * shown but disabled so the gap is visible rather than silently missing.
 */
const CARD_PAYMENT_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function PaymentForm({ value, onChange }: PaymentFormProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-lg font-semibold">Payment</legend>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
          value === 'COMPANY_ACCOUNT'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
            : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
        }`}
      >
        <input
          type="radio"
          name="paymentMethod"
          value="COMPANY_ACCOUNT"
          checked={value === 'COMPANY_ACCOUNT'}
          onChange={() => onChange('COMPANY_ACCOUNT')}
          className="mt-1"
        />
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <span>
          <span className="block font-medium">Company account</span>
          <span className="block text-sm text-neutral-600 dark:text-neutral-400">
            Added to your company&apos;s monthly invoice, payable in 30 days.
          </span>
        </span>
      </label>

      <label
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          CARD_PAYMENT_ENABLED
            ? 'cursor-pointer border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
            : 'cursor-not-allowed border-neutral-200 opacity-60 dark:border-neutral-800'
        }`}
      >
        <input
          type="radio"
          name="paymentMethod"
          value="CREDIT_CARD"
          disabled={!CARD_PAYMENT_ENABLED}
          checked={value === 'CREDIT_CARD'}
          onChange={() => onChange('CREDIT_CARD')}
          className="mt-1"
        />
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
        <span>
          <span className="block font-medium">Credit card</span>
          <span className="block text-sm text-neutral-600 dark:text-neutral-400">
            {CARD_PAYMENT_ENABLED
              ? 'Pay now by card.'
              : 'Not available yet — no payment provider is configured.'}
          </span>
        </span>
      </label>
    </fieldset>
  );
}
