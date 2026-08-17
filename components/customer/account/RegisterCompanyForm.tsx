'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { FIELD } from '@/components/customer/account/ui';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import PhoneInput from '@/components/shared/ui/PhoneInput';

export default function RegisterCompanyForm({
  defaultJobTitle,
}: {
  defaultJobTitle: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit =
    Boolean(name.trim()) && Boolean(billingEmail.trim()) && !saving;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/account/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          billingEmail,
          phone,
          billingAddress,
          jobTitle: defaultJobTitle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not register company');
      if (data.company?.id) {
        await update({ companyId: data.company.id });
      }
      toast.success('Company submitted for admin review');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not register');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Register your workplace if you are HR, a manager, or another contact.
        An admin reviews the account before staff links and company billing
        go live.
      </p>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="reg-company-name">
          Company name
          <RequiredMark />
        </label>
        <input
          id="reg-company-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={FIELD}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="reg-billing-email">
          Billing email
          <RequiredMark />
        </label>
        <input
          id="reg-billing-email"
          type="email"
          required
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
          className={FIELD}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="reg-phone">
          Company phone
        </label>
        <PhoneInput
          id="reg-phone"
          value={phone}
          onChange={setPhone}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="reg-address">
          Billing address
        </label>
        <textarea
          id="reg-address"
          rows={2}
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          className={FIELD}
        />
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? 'Submitting…' : 'Submit for review'}
      </button>
    </form>
  );
}
