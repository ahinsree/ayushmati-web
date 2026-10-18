"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function AddToCartButton({ slug, name, compact = false }: { slug: string; name: string; compact?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(slug);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      aria-label={`Add ${name} to cart`}
      className={`inline-flex shrink-0 items-center whitespace-nowrap justify-center gap-2 rounded-full bg-forest-700 font-semibold text-white transition hover:bg-forest-600 ${
        compact ? "h-9 px-4 text-sm" : "h-12 px-6"
      }`}
    >
      {added ? <Check className="h-4 w-4" aria-hidden /> : <ShoppingBag className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{added ? "Added" : "Add to cart"}</span>
    </button>
  );
}
