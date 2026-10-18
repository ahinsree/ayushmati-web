"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProduct } from "@/lib/catalog";

// Client-side cart kept in localStorage. Checkout and server-side carts arrive with the
// Razorpay milestone (docs/backlog/03-checkout-razorpay.md).

export type CartLine = { slug: string; qty: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ayushmati-cart-v1";
const MAX_QTY = 10;

function readStored(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine => typeof l?.slug === "string" && Number.isInteger(l?.qty) && l.qty > 0 && !!getProduct(l.slug),
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Read after mount so server and client render the same empty cart first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(readStored());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be unavailable (private mode); the cart still works for this visit.
    }
  }, [lines, loaded]);

  const setQty = useCallback((slug: string, qty: number) => {
    setLines((prev) => {
      const clamped = Math.max(0, Math.min(MAX_QTY, Math.floor(qty)));
      const rest = prev.filter((l) => l.slug !== slug);
      if (clamped === 0) return rest;
      const exists = prev.some((l) => l.slug === slug);
      return exists ? prev.map((l) => (l.slug === slug ? { slug, qty: clamped } : l)) : [...prev, { slug, qty: clamped }];
    });
  }, []);

  const add = useCallback(
    (slug: string, qty = 1) => {
      if (!getProduct(slug)) return;
      setLines((prev) => {
        const current = prev.find((l) => l.slug === slug)?.qty ?? 0;
        const next = Math.min(MAX_QTY, current + qty);
        return current ? prev.map((l) => (l.slug === slug ? { slug, qty: next } : l)) : [...prev, { slug, qty: next }];
      });
    },
    [],
  );

  const remove = useCallback((slug: string) => setLines((prev) => prev.filter((l) => l.slug !== slug)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);
    return { lines, count, subtotal, add, setQty, remove, clear };
  }, [lines, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
