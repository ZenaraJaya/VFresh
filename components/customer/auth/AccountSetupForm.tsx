'use client';

import { useState } from 'react';
import { Building2, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PaymentMethod } from '@/types';
import AddressMapPicker from '@/components/maps/AddressMapPicker';
import PhoneInput from '@/components/shared/ui/PhoneInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import { FIELD } from '@/components/customer/account/ui';

function brandFromNumber(digits: string) {
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (digits.startsWith('34') || digits.startsWith('37')) return 'American Express';
  return '';
}

export default function AccountSetupForm({
  defaultName,
  defaultEmail,
  onSaved,
}: {
  defaultName?: string;
  defaultEmail?: string;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('CREDIT_CARD');
  const [billingName, setBillingName] = useState(defaultName ?? '');
  const [billingEmail, setBillingEmail] = useState(defaultEmail ?? '');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingPostcode, setBillingPostcode] = useState('');
  const [billingState, setBillingState] = useState('Sarawak');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [cardholderName, setCardholderName] = useState(defaultName ?? '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');

  const onCardNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim());
    setCardBrand(brandFromNumber(digits) || cardBrand);
    setCardLast4(digits.length >= 4 ? digits.slice(-4) : '');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingAddress.trim()) {
      toast.error('Add a delivery / billing address');
      return;
    }
    const digits = cardNumber.replace(/\s/g, '');
    if (paymentMethod === 'CREDIT_CARD') {
      if (!cardholderName.trim()) {
        toast.error('Enter the name on the card');
        return;
      }
      if (!cardLast4 || cardLast4.length !== 4) {
        toast.error('Enter your card number so we can save the last four digits');
        return;
      }
      if (digits && (digits.length < 13 || digits.length > 16)) {
        toast.error('Enter a valid card number');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          billingName,
          billingEmail,
          billingPhone,
          billingAddress,
          billingCity,
          billingPostcode,
          billingState,
          cardholderName:
            paymentMethod === 'CREDIT_CARD' ? cardholderName : '',
          cardBrand: paymentMethod === 'CREDIT_CARD' ? cardBrand : '',
          cardLast4: paymentMethod === 'CREDIT_CARD' ? cardLast4 : '',
          cardExpMonth:
            paymentMethod === 'CREDIT_CARD' && cardExpMonth
              ? Number(cardExpMonth)
              : null,
          cardExpYear:
            paymentMethod === 'CREDIT_CARD' && cardExpYear
              ? Number(cardExpYear)
              : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save');
      toast.success('Payment and address saved');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-5">
      <div>
        <label htmlFor="setup-address" className="text-sm font-medium">
          Delivery / billing address
          <RequiredMark />
        </label>
        <input
          id="setup-address"
          required
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          placeholder="Office, floor and unit"
          className={`${FIELD} mt-1`}
        />
        <div className="mt-3">
          <AddressMapPicker
            address={billingAddress}
            lat={pin?.lat}
            lng={pin?.lng}
            onChange={({ address, lat, lng }) => {
              setPin({ lat, lng });
              if (address) setBillingAddress(address);
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="setup-city" className="text-sm font-medium">
            City
          </label>
          <input
            id="setup-city"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            placeholder="Miri"
            className={FIELD}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="setup-postcode" className="text-sm font-medium">
            Postcode
          </label>
          <input
            id="setup-postcode"
            value={billingPostcode}
            onChange={(e) => setBillingPostcode(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="setup-name" className="text-sm font-medium">
            Billing name
            <RequiredMark />
          </label>
          <input
            id="setup-name"
            required
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="setup-email" className="text-sm font-medium">
            Billing email
            <RequiredMark />
          </label>
          <input
            id="setup-email"
            type="email"
            required
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="setup-phone" className="text-sm font-medium">
            Billing phone
          </label>
          <PhoneInput
            id="setup-phone"
            value={billingPhone}
            onChange={setBillingPhone}
          />
        </div>
      </div>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 w-full text-sm font-medium">
          How you pay
          <RequiredMark />
        </legend>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
            paymentMethod === 'CREDIT_CARD'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <input
            type="radio"
            name="setup-pay"
            className="mt-1"
            checked={paymentMethod === 'CREDIT_CARD'}
            onChange={() => setPaymentMethod('CREDIT_CARD')}
          />
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <span>
            <span className="block text-sm font-medium">Card — you pay</span>
            <span className="text-xs text-neutral-500">
              We store the last four digits only.
            </span>
          </span>
        </label>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
            paymentMethod === 'COMPANY_ACCOUNT'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <input
            type="radio"
            name="setup-pay"
            className="mt-1"
            checked={paymentMethod === 'COMPANY_ACCOUNT'}
            onChange={() => setPaymentMethod('COMPANY_ACCOUNT')}
          />
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <span>
            <span className="block text-sm font-medium">Company invoice</span>
            <span className="text-xs text-neutral-500">
              After your workplace is approved.
            </span>
          </span>
        </label>
      </fieldset>

      {paymentMethod === 'CREDIT_CARD' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="setup-card-name" className="text-sm font-medium">
              Name on card
              <RequiredMark />
            </label>
            <input
              id="setup-card-name"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className={FIELD}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="setup-card-number" className="text-sm font-medium">
              Card number
              <RequiredMark />
            </label>
            <input
              id="setup-card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="ACCT-000003"
              value={cardNumber}
              onChange={(e) => onCardNumber(e.target.value)}
              className={FIELD}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="setup-exp-m" className="text-sm font-medium">
              Expiry month
            </label>
            <input
              id="setup-exp-m"
              inputMode="numeric"
              placeholder="MM"
              maxLength={2}
              value={cardExpMonth}
              onChange={(e) =>
                setCardExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))
              }
              className={FIELD}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="setup-exp-y" className="text-sm font-medium">
              Expiry year
            </label>
            <input
              id="setup-exp-y"
              inputMode="numeric"
              placeholder="YYYY"
              maxLength={4}
              value={cardExpYear}
              onChange={(e) =>
                setCardExpYear(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className={FIELD}
            />
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save and continue
      </button>
    </form>
  );
}
