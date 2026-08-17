'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HOME_SECTION_KEY, scrollToSectionId } from './ScrollToHash';

export default function HomeHashLink({
  hash,
  className,
  children,
  onNavigate,
}: {
  hash: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onNavigate?.();
        if (pathname === '/') {
          scrollToSectionId(hash);
          window.history.replaceState(null, '', '/');
          return;
        }
        try {
          sessionStorage.setItem(HOME_SECTION_KEY, hash);
        } catch {
          // ignore
        }
        router.push('/');
      }}
    >
      {children}
    </Link>
  );
}
