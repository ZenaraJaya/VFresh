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
  addItem: (item: MenuItem, quantity?: number, notes?: string) => void;
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
    setLines((prev) => {
      const existing = prev.find((l) => l.menuItem.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.menuItem.id === item.id
            ? { ...l, quantity: l.quantity + quantity, notes: notes ?? l.notes }
            : l
        );
      }
      return [...prev, { menuItem: item, quantity, notes }];
    });
  }, [setLines]);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItem.id !== menuItemId));
  }, [setLines]);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.menuItem.id !== menuItemId)
        : prev.map((l) =>
            l.menuItem.id === menuItemId ? { ...l, quantity } : l
          )
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
