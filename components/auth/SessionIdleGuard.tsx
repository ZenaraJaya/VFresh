'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SESSION_IDLE_MS, SESSION_IDLE_SECONDS, SESSION_TOUCH_THROTTLE_MS } from '@/lib/session-idle';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'pointerdown',
  'keydown',
  'touchstart',
];

export default function SessionIdleGuard() {
  const { data, status, update } = useSession();
  const pathname = usePathname();
  const lastTouch = useRef(0);
  const signedOut = useRef(false);

  useEffect(() => {
    signedOut.current = false;
  }, [data?.user?.id]);

  useEffect(() => {
    if (status !== 'authenticated' || !data?.user?.id) return;

    const expire = () => {
      if (signedOut.current) return;
      signedOut.current = true;
      toast.error('Your session expired. Please sign in again.');
      const next =
        pathname && pathname !== '/login'
          ? `/login?callbackUrl=${encodeURIComponent(pathname)}`
          : '/login';
      void signOut({ callbackUrl: next });
    };

    if (data.idleExpired) {
      expire();
      return;
    }

    let remaining = SESSION_IDLE_MS;
    if (typeof data.lastActivity === 'number') {
      remaining = Math.max(
        0,
        SESSION_IDLE_SECONDS * 1000 - (Date.now() - data.lastActivity * 1000)
      );
    }

    if (remaining <= 0) {
      expire();
      return;
    }

    let idleTimer = window.setTimeout(expire, remaining);

    const onActivity = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(expire, SESSION_IDLE_MS);
      const now = Date.now();
      if (now - lastTouch.current < SESSION_TOUCH_THROTTLE_MS) return;
      lastTouch.current = now;
      void update();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      window.clearTimeout(idleTimer);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [data?.idleExpired, data?.lastActivity, data?.user?.id, pathname, status, update]);

  return null;
}
