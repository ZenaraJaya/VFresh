'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentForm from './PaymentForm';
import { useCart } from '@/context/CartContext';
import { groupCartByVendor } from '@/lib/group-cart';
import type { PaymentMethod } from '@/types';
import RequiredMark from '@/components/shared/ui/RequiredMark';

const schema = z.object({
  companyId: z.string().min(1, 'Select your company'),
  employeeName: z.string().min(1, 'Required'),
  employeeEmail: z.union([z.email('Enter a valid email'), z.literal('')]),
  employeePhone: z.string().max(40).optional(),
  department: z.string().max(120).optional(),
  deliveryLocation: z.string().min(1, 'Where should we deliver?'),
  deliveryDate: z.string().min(1, 'Pick a date'),
  deliveryTime: z.string().optional(),
  specialInstructions: z.string().max(1000).optional()
});

type FormValues = z.infer<typeof schema>;

/** Today in the browser's timezone, as the yyyy-mm-dd a date input expects. */
function todayISO() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export default function CheckoutForm() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const vendorGroups = groupCartByVendor(lines);

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('COMPANY_ACCOUNT');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryDate: todayISO(), employeeEmail: '' }
  });

  useEffect(() => {
    fetch('/api/companies')
      .then((res) => (res.ok ? res.json() : []))
      .then(setCompanies)
      .catch(() => toast.error('Could not load company accounts'));
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (lines.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          paymentMethod,
          items: lines.map((l) => ({
            menuItemId: l.menuItem.id,
            quantity: l.quantity,
            notes: l.notes ?? ''
          }))
        })
      });

      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error ?? 'Could not place the order');
        return;
      }

      const created: { orderNumber: string }[] = Array.isArray(body.orders)
        ? body.orders
        : body.orderNumber
          ? [{ orderNumber: body.orderNumber }]
          : [];

      if (created.length === 0) {
        toast.error('Could not place the order');
        return;
      }

      clear();
      if (created.length === 1) {
        router.push(`/order-confirmation/${created[0].orderNumber}`);
      } else {
        const n = created.map((o) => o.orderNumber).join(',');
        router.push(`/order-confirmation/placed?n=${encodeURIComponent(n)}`);
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950';
  const errorClass = 'mt-1 text-xs text-red-600 dark:text-red-400';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-3 text-lg font-semibold">Who is ordering</legend>

        <div>
          <label htmlFor="companyId" className="mb-1 block text-sm font-medium">
            Company account
            <RequiredMark />
          </label>
          <select id="companyId" {...register('companyId')} className={inputClass}>
            <option value="">Select a company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.companyId && (
            <p className={errorClass}>{errors.companyId.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="employeeName"
              className="mb-1 block text-sm font-medium"
            >
              Your name
              <RequiredMark />
            </label>
            <input
              id="employeeName"
              {...register('employeeName')}
              className={inputClass}
            />
            {errors.employeeName && (
              <p className={errorClass}>{errors.employeeName.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="department"
              className="mb-1 block text-sm font-medium"
            >
              Department <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              id="department"
              {...register('department')}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="employeeEmail"
              className="mb-1 block text-sm font-medium"
            >
              Email <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              id="employeeEmail"
              type="email"
              {...register('employeeEmail')}
              className={inputClass}
            />
            {errors.employeeEmail && (
              <p className={errorClass}>{errors.employeeEmail.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="employeePhone"
              className="mb-1 block text-sm font-medium"
            >
              Phone <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              id="employeePhone"
              {...register('employeePhone')}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-lg font-semibold">Delivery</legend>

        <div>
          <label
            htmlFor="deliveryLocation"
            className="mb-1 block text-sm font-medium"
          >
            Address, floor and unit
            <RequiredMark />
          </label>
          <input
            id="deliveryLocation"
            placeholder="Level 22, Menara Binjai, Jalan Binjai"
            {...register('deliveryLocation')}
            className={inputClass}
          />
          {errors.deliveryLocation && (
            <p className={errorClass}>{errors.deliveryLocation.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="deliveryDate"
              className="mb-1 block text-sm font-medium"
            >
              Delivery date
              <RequiredMark />
            </label>
            <input
              id="deliveryDate"
              type="date"
              min={todayISO()}
              {...register('deliveryDate')}
              className={inputClass}
            />
            {errors.deliveryDate && (
              <p className={errorClass}>{errors.deliveryDate.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="deliveryTime"
              className="mb-1 block text-sm font-medium"
            >
              Preferred window
            </label>
            <select
              id="deliveryTime"
              {...register('deliveryTime')}
              className={inputClass}
            >
              <option value="">No preference</option>
              <option value="11:30 - 12:00">11:30 – 12:00</option>
              <option value="12:00 - 12:30">12:00 – 12:30</option>
              <option value="12:30 - 13:00">12:30 – 13:00</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="specialInstructions"
            className="mb-1 block text-sm font-medium"
          >
            Notes for the driver{' '}
            <span className="text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="specialInstructions"
            rows={3}
            {...register('specialInstructions')}
            className={inputClass}
          />
        </div>
      </fieldset>

      <PaymentForm value={paymentMethod} onChange={setPaymentMethod} />

      {vendorGroups.length > 1 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Your cart has {vendorGroups.length} kitchens. Each kitchen gets its
          own order ID: {vendorGroups.map((g) => g.vendorName).join(', ')}.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || lines.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {vendorGroups.length > 1
          ? `Place ${vendorGroups.length} orders`
          : 'Place order'}
      </button>
    </form>
  );
}
