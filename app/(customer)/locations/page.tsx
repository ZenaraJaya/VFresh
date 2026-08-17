'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HOME_SECTION_KEY } from '@/components/customer/layout/ScrollToHash';

export default function LocationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      sessionStorage.setItem(HOME_SECTION_KEY, 'location');
    } catch {
      // ignore
    }
    router.replace('/');
  }, [router]);

  return null;
}
