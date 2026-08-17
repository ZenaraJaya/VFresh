'use client';

import { Building2, CreditCard } from 'lucide-react';
import type { PaymentMethod } from '@/types';
import RequiredMark from '@/components/shared/ui/RequiredMark';

interface PaymentFormProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  companyInvoiceEnabled?: boolean;
}

const CARD_PAYMENT_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function PaymentForm({
  value,
  onChange,
  companyInvoiceEnabled = true,
}: PaymentFormProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-lg font-semibold">
        Payment
        <RequiredMark />
      </legend>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
          value === 'CREDIT_CARD'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
            : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
        }`}
      >
        <input
          type="radio"
          name="paymentMethod"
          value="CREDIT_CARD"
          checked={value === 'CREDIT_CARD'}
          onChange={() => onChange('CREDIT_CARD')}
          className="mt-1"
        />
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <span>
          <span className="block font-medium">Card — you pay</span>
          <span className="block text-sm text-neutral-600 dark:text-neutral-400">
            {CARD_PAYMENT_ENABLED
              ? 'Charged to the card saved in Billing.'
              : 'Save your card under Account → Billing. Card capture is on when Stripe keys are set.'}
          </span>
        </span>
      </label>

      <label
        className={`flex items-start gap-3 rounded-xl border p-4 transition ${
          !companyInvoiceEnabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer'
        } ${
          value === 'COMPANY_ACCOUNT'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
            : 'border-neutral-200 hover:bg-white hover:text-neutral-900 dark:border-neutral-700'
        }`}
      >
        <input
          type="radio"
          name="paymentMethod"
          value="COMPANY_ACCOUNT"
          checked={value === 'COMPANY_ACCOUNT'}
          disabled={!companyInvoiceEnabled}
          onChange={() => onChange('COMPANY_ACCOUNT')}
          className="mt-1"
        />
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <span>
          <span className="block font-medium">Company invoice</span>
          <span className="block text-sm text-neutral-600 dark:text-neutral-400">
            {companyInvoiceEnabled
              ? "Added to your company's monthly invoice, payable in 30 days."
              : 'Available after an admin approves your workplace.'}
          </span>
        </span>
      </label>
    </fieldset>
  );
}
