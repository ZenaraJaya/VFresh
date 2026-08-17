'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const HOME_SECTION_KEY = 'vf-home-section';

export function scrollToSectionId(id: string) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function pendingSection() {
  try {
    const stored = sessionStorage.getItem(HOME_SECTION_KEY);
    if (stored) {
      sessionStorage.removeItem(HOME_SECTION_KEY);
      return stored;
    }
  } catch {
    // ignore
  }
  return window.location.hash.replace(/^#/, '');
}

/** After arriving on `/`, scroll to the requested section and keep the URL as `/`. */
export default function ScrollToHash() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;
    const id = pendingSection();
    if (!id) return;

    let attempts = 0;
    const tick = () => {
      if (scrollToSectionId(id) || attempts++ > 20) return;
      window.setTimeout(tick, 50);
    };
    const t = window.setTimeout(tick, 0);
    if (window.location.hash) {
      window.history.replaceState(null, '', '/');
    }
    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}
