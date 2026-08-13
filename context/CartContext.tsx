'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
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
