'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';

type OrderLine = {
  id: string;
  orderNumber: string;
  employeeName: string;
  total: number;
  status: string;
  deliveryDate: string;
};

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  calculatedTotal: number;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  company: {
    name: string;
    billingEmail: string;
    billingAddress: string | null;
    phone: string | null;
  };
  orders: OrderLine[];
  available: OrderLine[];
};

function malaysiaYmd(value: string) {
  return new Date(value).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kuching',
  });
}

function addCalendarDay(ymd: string, days: number) {
  const [year, month, day] = ymd.slice(0, 10).split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

const fieldClass =
  'w-full rounded-lg border border-neutral-200 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700';

export default function InvoiceEditor() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [form, setForm] = useState({
    invoiceNumber: '',
    companyName: '',
    billingEmail: '',
    billingAddress: '',
    phone: '',
    periodStart: '',
    periodEndInclusive: '',
    dueDate: '',
  });

  const applyInvoice = (data: InvoiceDetail) => {
    setInvoice(data);
    setForm({
      invoiceNumber: data.invoiceNumber,
      companyName: data.company.name,
      billingEmail: data.company.billingEmail,
      billingAddress: data.company.billingAddress ?? '',
      phone: data.company.phone ?? '',
      periodStart: malaysiaYmd(data.periodStart),
      periodEndInclusive: addCalendarDay(malaysiaYmd(data.periodEnd), -1),
      dueDate: malaysiaYmd(data.dueDate),
    });
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applyInvoice(data);
    } catch {
      toast.error('Could not load invoice');
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      applyInvoice(data);
      if (ok) toast.success(ok);
      return data as InvoiceDetail & { emailed?: boolean; emailedTo?: string };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveBody = () => ({
    action: 'save',
    invoiceNumber: form.invoiceNumber,
    companyName: form.companyName,
    billingEmail: form.billingEmail,
    billingAddress: form.billingAddress,
    phone: form.phone,
    periodStart: form.periodStart,
    periodEndInclusive: form.periodEndInclusive,
    dueDate: form.dueDate,
  });

  const saveThenSend = async () => {
    const saved = await patch(saveBody());
    if (!saved) return;
    const sent = await patch({ action: 'send' });
    if (!sent) return;
    setConfirmSend(false);
    toast.success(`Emailed ${sent.invoiceNumber} to ${sent.emailedTo || form.billingEmail}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <p className="text-sm text-neutral-500">
        Invoice not found.{' '}
        <Link href="/admin/billing" className="text-emerald-700 underline">
          Back to billing
        </Link>
      </p>
    );
  }

  const locked = invoice.status === 'CANCELLED' || invoice.status === 'PAID';
  const canSend = invoice.status === 'DRAFT' || invoice.status === 'SENT';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Billing
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Invoice preview · {invoice.status}
          </p>
        </div>
        {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-400"
          >
            Cancel invoice
          </button>
        ) : null}
      </div>

      {invoice.status === 'CANCELLED' ? (
        <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          This invoice is cancelled. Its orders were returned to unbilled.
        </p>
      ) : (
        <>
          <article className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
              <div className="min-w-[12rem] flex-1 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Invoice
                </p>
                <input
                  value={form.invoiceNumber}
                  disabled={locked}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
                  }
                  className={`${fieldClass} font-mono text-xl font-bold`}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-neutral-500">
                    Period start
                    <input
                      type="date"
                      disabled={locked}
                      value={form.periodStart}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, periodStart: e.target.value }))
                      }
                      className={`${fieldClass} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-neutral-500">
                    Period end
                    <input
                      type="date"
                      disabled={locked}
                      value={form.periodEndInclusive}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          periodEndInclusive: e.target.value,
                        }))
                      }
                      className={`${fieldClass} mt-1`}
                    />
                  </label>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Amount due
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {formatMYR(invoice.totalAmount)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Sum of company-account orders on this invoice
                </p>
              </div>
            </div>

            <div className="grid gap-6 py-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Bill to
                </p>
                <input
                  disabled={locked}
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                  className={`${fieldClass} font-semibold`}
                  placeholder="Company name"
                />
                <input
                  disabled={locked}
                  type="email"
                  value={form.billingEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billingEmail: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Billing email"
                />
                <input
                  disabled={locked}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Phone"
                />
                <textarea
                  disabled={locked}
                  rows={3}
                  value={form.billingAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billingAddress: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Billing address"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Payment
                </p>
                <label className="block text-xs text-neutral-500">
                  Due date
                  <input
                    type="date"
                    disabled={locked}
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                    className={`${fieldClass} mt-1`}
                  />
                </label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Saving updates this invoice and the company bill-to details.
                  Send emails the saved preview to the billing address.
                </p>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Orders
                </h2>
                {!locked ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patch(
                        { action: 'sync' },
                        'Orders refreshed for this period'
                      )
                    }
                    className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-60"
                  >
                    Recalculate from period
                  </button>
                ) : null}
              </div>
              {invoice.orders.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-500">
                  No orders attached.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {invoice.orders.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-mono font-medium">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {order.employeeName} · {order.status}
                          {order.status === 'CANCELLED'
                            ? ' · will not be billed'
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold tabular-nums">
                          {formatMYR(order.total)}
                        </span>
                        {!locked ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void patch(
                                {
                                  action: 'order',
                                  orderId: order.id,
                                  attach: false,
                                },
                                'Order removed'
                              )
                            }
                            className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-60"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-between border-t border-neutral-200 pt-3 text-sm font-semibold dark:border-neutral-800">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatMYR(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </article>

          {!locked ? (
            <>
              <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Unbilled orders in this period
                </h2>
                {invoice.available.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">
                    No other company-account orders left in this period.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {invoice.available.map((order) => (
                      <li
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                      >
                        <div>
                          <p className="font-mono font-medium">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {order.employeeName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums">
                            {formatMYR(order.total)}
                          </span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void patch(
                                {
                                  action: 'order',
                                  orderId: order.id,
                                  attach: true,
                                },
                                'Order added'
                              )
                            }
                            className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-60"
                          >
                            Add
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="mx-auto flex max-w-3xl flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patch(saveBody(), 'Preview saved')}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium dark:border-neutral-700"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save preview'
                  )}
                </button>
                {canSend ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmSend(true)}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {invoice.status === 'SENT' ? 'Email again' : 'Send invoice'}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </>
      )}

      {confirmSend ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">
              {invoice.status === 'SENT' ? 'Email again' : 'Send invoice'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Save this preview and email {form.invoiceNumber} to{' '}
              <span className="font-medium text-neutral-900 dark:text-white">
                {form.billingEmail || '(add a billing email first)'}
              </span>
              . The invoice is only marked sent if Brevo accepts the message.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmSend(false)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium dark:border-neutral-600"
              >
                Keep editing
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveThenSend()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save and send
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmCancel ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">Cancel invoice</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Cancel {invoice.invoiceNumber}? Orders return to unbilled.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmCancel(false)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-white dark:hover:text-neutral-900"
              >
                Keep invoice
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void patch({ action: 'cancel' }, 'Invoice cancelled').then(
                    () => setConfirmCancel(false)
                  )
                }
                className="rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-500 dark:text-red-400"
              >
                Cancel invoice
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
