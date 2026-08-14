'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLivePoll } from '@/lib/use-live-poll';

type Item = {
  id: string;
  href: string;
  kind: 'ping' | 'late' | 'run';
  title: string;
  body: string;
  at: string;
  unread: boolean;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastUnread = useRef(0);
  const primed = useRef(false);

  useLivePoll(async () => {
    const res = await fetch('/api/delivery/inbox', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return;
    const data = (await res.json()) as { items?: Item[]; unread?: number };
    const nextItems = data.items ?? [];
    const nextUnread = data.unread ?? 0;
    setItems(nextItems);
    setUnread(nextUnread);

    if (primed.current && nextUnread > lastUnread.current) {
      const newest = nextItems.find((item) => item.unread);
      toast(newest?.title || 'New delivery alert', { icon: '🔔' });
    }
    lastUnread.current = nextUnread;
    primed.current = true;
  }, 4000);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-neutral-300 dark:hover:bg-emerald-950/60"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <p className="border-b border-neutral-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
            Alerts
          </p>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              No kitchen pings or open runs yet.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 ${
                      item.unread ? 'bg-amber-50/80 dark:bg-amber-950/30' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                      {item.body}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
