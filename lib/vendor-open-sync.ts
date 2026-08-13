'use client';

import { useEffect } from 'react';

const EVENT = 'vfresh-vendor-open';

export function broadcastVendorOpen(accepting: boolean) {
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { accepting } })
  );
}

export function useVendorOpenSync(onChange: (accepting: boolean) => void) {
  useEffect(() => {
    const handler = (event: Event) => {
      const accepting = (event as CustomEvent<{ accepting: boolean }>).detail
        ?.accepting;
      if (typeof accepting === 'boolean') onChange(accepting);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [onChange]);
}
