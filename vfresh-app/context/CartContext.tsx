'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CartLine, MenuItem } from '@/types';
import { calculateTotals } from '@/lib/pricing';

const STORAGE_KEY = 'vfresh.cart';

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
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read once on mount — localStorage isn't available during SSR.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // corrupted or unavailable storage — start with an empty cart
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // quota or private mode — the cart just won't survive a reload
    }
  }, [lines, hydrated]);

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
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItem.id !== menuItemId));
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.menuItem.id !== menuItemId)
        : prev.map((l) =>
            l.menuItem.id === menuItemId ? { ...l, quantity } : l
          )
    );
  }, []);

  const setNotes = useCallback((menuItemId: string, notes: string) => {
    setLines((prev) =>
      prev.map((l) => (l.menuItem.id === menuItemId ? { ...l, notes } : l))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

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
