'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { useSession } from 'next-auth/react';
import type { CartLine, MenuItem } from '@/types';
import { calculateTotals } from '@/lib/pricing';
// Client-safe helpers only. Do not import `@/lib/daily-pack` (it pulls Prisma).
import { maxCartQty } from '@/lib/daily-pack-qty';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'vfresh.cart';
const EMPTY_RAW = '[]';

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function readRaw() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_RAW;
  } catch {
    return EMPTY_RAW;
  }
}

function parseLines(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLines(next: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota or private mode — the cart just won't survive a reload
  }
  emitChange();
}

function toSaved(lines: CartLine[]) {
  return lines.map((line) => ({
    menuItemId: line.menuItem.id,
    quantity: line.quantity,
    notes: line.notes,
  }));
}

let accountSync: { customerId: string; promise: Promise<void> } | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let skipNextPersist = false;
let persistReadyFor: string | null = null;

interface CartContextValue {
  lines: CartLine[];
  /** Total number of individual units, for the header badge. */
  count: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  /** False until the persisted cart has been read, so the UI can avoid a flash of "empty". */
  hydrated: boolean;
  addItem: (item: MenuItem, quantity?: number, notes?: string) => boolean;
  removeItem: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  setNotes: (menuItemId: string, notes: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const customerId =
    session?.user?.role === 'CUSTOMER' && session.user.id && !session.idleExpired
      ? session.user.id
      : null;
  const syncedFor = useRef<string | null>(null);

  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY_RAW);
  const lines = useMemo(() => parseLines(raw), [raw]);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const setLines = useCallback(
    (updater: CartLine[] | ((prev: CartLine[]) => CartLine[])) => {
      const prev = parseLines(readRaw());
      writeLines(typeof updater === 'function' ? updater(prev) : updater);
    },
    []
  );

  useEffect(() => {
    if (status === 'loading') return;

    if (!customerId) {
      if (syncedFor.current) {
        syncedFor.current = null;
        if (accountSync?.customerId) accountSync = null;
        persistReadyFor = null;
        skipNextPersist = true;
        writeLines([]);
      }
      return;
    }

    if (syncedFor.current === customerId) return;
    if (persistReadyFor === customerId) {
      syncedFor.current = customerId;
      return;
    }
    syncedFor.current = customerId;

    if (accountSync?.customerId === customerId) {
      void accountSync.promise;
      return;
    }

    const guest = toSaved(parseLines(readRaw()));
    accountSync = {
      customerId,
      promise: fetch('/api/account/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: guest }),
      })
        .then(async (res) => {
          if (!res.ok) {
            if (syncedFor.current === customerId) syncedFor.current = null;
            if (accountSync?.customerId === customerId) accountSync = null;
            return;
          }
          const data = (await res.json().catch(() => null)) as {
            lines?: CartLine[];
          } | null;
          if (!Array.isArray(data?.lines)) {
            if (syncedFor.current === customerId) syncedFor.current = null;
            if (accountSync?.customerId === customerId) accountSync = null;
            return;
          }
          skipNextPersist = true;
          persistReadyFor = customerId;
          writeLines(data.lines);
        })
        .catch(() => {
          if (syncedFor.current === customerId) syncedFor.current = null;
          if (accountSync?.customerId === customerId) accountSync = null;
        })
        .then(() => undefined),
    };

    void accountSync.promise;
  }, [customerId, status]);

  useEffect(() => {
    if (!customerId || persistReadyFor !== customerId) return;
    if (skipNextPersist) {
      skipNextPersist = false;
      return;
    }
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      void fetch('/api/account/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: toSaved(parseLines(readRaw())) }),
      }).catch(() => undefined);
    }, 400);
    return () => {
      if (persistTimer) clearTimeout(persistTimer);
    };
  }, [customerId, raw]);

  const addItem = useCallback((item: MenuItem, quantity = 1, notes?: string) => {
    const prev = parseLines(readRaw());
    const existing = prev.find((l) => l.menuItem.id === item.id);
    const already = existing?.quantity ?? 0;
    const max = maxCartQty(item.remainingQty);
    if (max <= 0) {
      toast.error('Sold out for today');
      return false;
    }
    if (already >= max) {
      toast.error(`Only ${max} left today`);
      return false;
    }
    const nextQty = Math.min(max, already + quantity);
    if (nextQty < already + quantity) {
      toast.error(`Only ${max} left today`);
    }
    const next = existing
      ? prev.map((l) =>
          l.menuItem.id === item.id
            ? {
                ...l,
                quantity: nextQty,
                notes: notes ?? l.notes,
                menuItem: { ...l.menuItem, remainingQty: item.remainingQty },
              }
            : l
        )
      : [...prev, { menuItem: item, quantity: nextQty, notes }];
    writeLines(next);
    return true;
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItem.id !== menuItemId));
  }, [setLines]);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.menuItem.id !== menuItemId) return [l];
        if (quantity <= 0) return [];
        const max = maxCartQty(l.menuItem.remainingQty);
        const next = Math.min(max, quantity);
        if (max > 0 && quantity > max) {
          toast.error(`Only ${max} left today`);
        }
        if (next <= 0) return [];
        return [{ ...l, quantity: next }];
      })
    );
  }, [setLines]);

  const setNotes = useCallback((menuItemId: string, notes: string) => {
    setLines((prev) =>
      prev.map((l) => (l.menuItem.id === menuItemId ? { ...l, notes } : l))
    );
  }, [setLines]);

  const clear = useCallback(() => setLines([]), [setLines]);

  const value = useMemo<CartContextValue>(() => {
    const { subtotal, tax, deliveryFee, total } = calculateTotals(
      lines.reduce((sum, l) => sum + l.menuItem.price * l.quantity, 0)
    );

    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal,
      tax,
      deliveryFee,
      total,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      setNotes,
      clear,
    };
  }, [lines, hydrated, addItem, removeItem, setQuantity, setNotes, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside a CartProvider');
  return ctx;
}
