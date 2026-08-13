'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PaymentMethod } from '@/types';
import { FIELD } from '@/components/customer/account/ui';

export type BillingValues = {
  paymentMethod: PaymentMethod;
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  billingCity: string;
  billingPostcode: string;
  billingState: string;
  cardholderName: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: string;
  cardExpYear: string;
};

function brandFromNumber(digits: string) {
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (digits.startsWith('34') || digits.startsWith('37')) return 'American Express';
  return '';
}

export default function BillingForm({ initial }: { initial: BillingValues }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [cardNumber, setCardNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BillingValues>(key: K, value: BillingValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onCardNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim());
    const brand = brandFromNumber(digits);
    setForm((prev) => ({
      ...prev,
      cardBrand: brand || prev.cardBrand,
      cardLast4: digits.length >= 4 ? digits.slice(-4) : prev.cardLast4,
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\s/g, '');
    if (form.paymentMethod === 'CREDIT_CARD') {
      if (!form.cardholderName.trim()) {
        toast.error('Enter the name on the card');
        return;
      }
      if (digits && (digits.length < 13 || digits.length > 16)) {
        toast.error('Enter a valid card number');
        return;
      }
      if (!form.cardLast4 || form.cardLast4.length !== 4) {
        toast.error('Enter your card number so we can save the last four digits');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: form.paymentMethod,
          billingName: form.billingName,
          billingEmail: form.billingEmail,
          billingPhone: form.billingPhone,
          billingAddress: form.billingAddress,
          billingCity: form.billingCity,
          billingPostcode: form.billingPostcode,
          billingState: form.billingState,
          cardholderName: form.cardholderName,
          cardBrand: form.cardBrand,
          cardLast4: form.cardLast4,
          cardExpMonth: form.cardExpMonth ? Number(form.cardExpMonth) : null,
          cardExpYear: form.cardExpYear ? Number(form.cardExpYear) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setCardNumber('');
      toast.success('Payment details saved');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-8">
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 w-full text-sm font-medium text-neutral-700 dark:text-neutral-300">
          How you pay
        </legend>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
            form.paymentMethod === 'CREDIT_CARD'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <input
            type="radio"
            name="pay"
            className="mt-1"
            checked={form.paymentMethod === 'CREDIT_CARD'}
            onChange={() => set('paymentMethod', 'CREDIT_CARD')}
          />
          <CreditCard className="mt-0.5 h-5 w-5 text-emerald-700" />
          <span>
            <span className="block font-medium">Card — you pay</span>
            <span className="text-sm text-neutral-500">
              Charged to your card when the order is placed.
            </span>
          </span>
        </label>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
            form.paymentMethod === 'COMPANY_ACCOUNT'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <input
            type="radio"
            name="pay"
            className="mt-1"
            checked={form.paymentMethod === 'COMPANY_ACCOUNT'}
            onChange={() => set('paymentMethod', 'COMPANY_ACCOUNT')}
          />
          <Building2 className="mt-0.5 h-5 w-5 text-emerald-700" />
          <span>
            <span className="block font-medium">Company invoice</span>
            <span className="text-sm text-neutral-500">
              Shared monthly bill for your workplace, due in 30 days.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Billing name" id="bn">
          <input
            id="bn"
            required
            value={form.billingName}
            onChange={(e) => set('billingName', e.target.value)}
            className={FIELD}
          />
        </Field>
        <Field label="Billing email" id="be">
          <input
            id="be"
            type="email"
            required
            value={form.billingEmail}
            onChange={(e) => set('billingEmail', e.target.value)}
            className={FIELD}
          />
        </Field>
        <Field label="Billing phone" id="bp">
          <input
            id="bp"
            value={form.billingPhone}
            onChange={(e) => set('billingPhone', e.target.value)}
            className={FIELD}
          />
        </Field>
        <Field label="State" id="bs">
          <input
            id="bs"
            value={form.billingState}
            onChange={(e) => set('billingState', e.target.value)}
            placeholder="Sarawak"
            className={FIELD}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Billing address" id="ba">
            <input
              id="ba"
              required
              value={form.billingAddress}
              onChange={(e) => set('billingAddress', e.target.value)}
              className={FIELD}
            />
          </Field>
        </div>
        <Field label="City" id="bc">
          <input
            id="bc"
            value={form.billingCity}
            onChange={(e) => set('billingCity', e.target.value)}
            placeholder="Miri"
            className={FIELD}
          />
        </Field>
        <Field label="Postcode" id="bz">
          <input
            id="bz"
            value={form.billingPostcode}
            onChange={(e) => set('billingPostcode', e.target.value)}
            className={FIELD}
          />
        </Field>
      </div>

      {form.paymentMethod === 'CREDIT_CARD' ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-neutral-900 p-5 text-white shadow-md">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">
              Card on file
            </p>
            <p className="mt-8 font-mono text-xl tracking-[0.2em]">
              •••• •••• •••• {form.cardLast4 || '••••'}
            </p>
            <div className="mt-6 flex justify-between text-sm">
              <span className="uppercase">
                {form.cardholderName || 'Name on card'}
              </span>
              <span>
                {form.cardExpMonth && form.cardExpYear
                  ? `${String(form.cardExpMonth).padStart(2, '0')}/${String(form.cardExpYear).slice(-2)}`
                  : 'MM/YY'}
              </span>
            </div>
            <p className="mt-2 text-xs text-emerald-100">
              {form.cardBrand || 'Visa / Mastercard'}
            </p>
          </div>
          <p className="text-xs text-neutral-500">
            We only store the cardholder name, brand, last four digits, and
            expiry — never the full card number.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name on card" id="cn">
              <input
                id="cn"
                value={form.cardholderName}
                onChange={(e) => set('cardholderName', e.target.value)}
                className={FIELD}
              />
            </Field>
            <Field label="Card number" id="cnum">
              <input
                id="cnum"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="ACCT-000003"
                value={cardNumber}
                onChange={(e) => onCardNumber(e.target.value)}
                className={FIELD}
              />
            </Field>
            <Field label="Expiry month" id="cm">
              <input
                id="cm"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={form.cardExpMonth}
                onChange={(e) => set('cardExpMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                className={FIELD}
              />
            </Field>
            <Field label="Expiry year" id="cy">
              <input
                id="cy"
                inputMode="numeric"
                placeholder="YYYY"
                maxLength={4}
                value={form.cardExpYear}
                onChange={(e) => set('cardExpYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={FIELD}
              />
            </Field>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save payment details'}
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
