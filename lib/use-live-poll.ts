import { useEffect, useRef } from 'react';

/** Poll while the tab is visible. First run is immediate. */
export function useLivePoll(tick: () => void | Promise<void>, ms = 4000) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      try {
        await tickRef.current();
      } catch {
        // keep polling
      }
      if (!cancelled) timer = setTimeout(run, ms);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };

    void run();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ms]);
}
