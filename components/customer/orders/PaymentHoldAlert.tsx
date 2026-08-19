'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { lockBodyScroll } from '@/lib/body-scroll-lock';

type Notice = { orderNumber: string; message: string };

export default function PaymentHoldAlert() {
  const { data, status } = useSession();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || data?.user?.role !== 'CUSTOMER') return;
    let cancelled = false;
    fetch('/api/account/notices', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { notices: [] }))
      .then((body) => {
        if (cancelled) return;
        const list = Array.isArray(body.notices) ? body.notices : [];
        setNotices(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [data?.user?.role, status]);

  useEffect(() => {
    if (notices.length === 0) return;
    const unlock = lockBodyScroll();
    return unlock;
  }, [notices.length]);

  const dismiss = () => {
    setNotices([]);
    void fetch('/api/account/notices', { method: 'POST' });
  };

  if (!mounted || notices.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close notice"
        onClick={dismiss}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="payment-hold-title"
        className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2
          id="payment-hold-title"
          className="text-lg font-semibold text-neutral-900 dark:text-white"
        >
          Payment window ended
        </h2>
        <div className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
          {notices.map((notice) => (
            <p key={notice.orderNumber}>{notice.message}</p>
          ))}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            href="/menu"
            onClick={dismiss}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Order again
          </Link>
          <Link
            href="/menu"
            onClick={dismiss}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-center text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Choose something else
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
