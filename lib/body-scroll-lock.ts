let lockCount = 0;
let previousOverflow = '';

/** Nested modals can lock/unlock without leaving the page stuck. */
export function lockBodyScroll() {
  if (typeof document === 'undefined') return () => undefined;

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;

  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
    }
  };
}
