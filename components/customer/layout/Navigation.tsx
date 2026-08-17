'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import HomeHashLink from './HomeHashLink';

const SECTION_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'menu', label: 'Menu' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'location', label: 'Locations' },
] as const;

const TRACK = { href: '/order-confirmation', label: 'Track order' };

function navClass(active: boolean, vertical: boolean) {
  return `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium ${
    vertical ? 'justify-start' : 'justify-center text-center'
  } ${
    active
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
      : 'text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-neutral-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200'
  }`;
}

interface NavigationProps {
  vertical?: boolean;
  onNavigate?: () => void;
}

export default function Navigation({ vertical, onNavigate }: NavigationProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    if (pathname !== '/') return;

    const ids = SECTION_LINKS.map((link) => link.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [pathname]);

  const onHome = pathname === '/';
  const trackActive = pathname.startsWith('/order-confirmation');

  return (
    <nav
      className={
        vertical
          ? 'grid grid-cols-1 gap-1'
          : 'hidden lg:grid lg:grid-cols-5 lg:items-center lg:gap-1'
      }
    >
      {SECTION_LINKS.map((link) => (
        <HomeHashLink
          key={link.id}
          hash={link.id}
          onNavigate={onNavigate}
          className={navClass(onHome && activeSection === link.id, !!vertical)}
        >
          {link.label}
        </HomeHashLink>
      ))}
      <Link
        href={TRACK.href}
        onClick={onNavigate}
        className={navClass(trackActive, !!vertical)}
      >
        {TRACK.label}
      </Link>
    </nav>
  );
}
