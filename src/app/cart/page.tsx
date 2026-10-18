"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { getProduct } from "@/lib/catalog";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, setQty, remove } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <h1 className="font-display text-4xl text-forest-900">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-10 text-center ring-1 ring-forest-900/5">
          <p className="text-muted">Your cart is empty.</p>
          <Link href="/shop" className="mt-4 inline-block font-semibold text-forest-700 underline">
            Browse remedies
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_18rem]">
          <ul className="divide-y divide-forest-900/10 rounded-3xl bg-white px-5 ring-1 ring-forest-900/5">
            {lines.map(({ slug, qty }) => {
              const p = getProduct(slug);
              if (!p) return null;
              return (
                <li key={slug} className="flex items-center gap-4 py-4">
                  <div className="w-20 shrink-0">
                    <ProductVisual category={p.category} name={p.name} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/shop/${slug}`} className="font-semibold text-forest-900 hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {p.size} · {formatINR(p.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <QtyButton label={`Decrease ${p.name}`} onClick={() => setQty(slug, qty - 1)}>
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </QtyButton>
                      <span className="w-6 text-center font-semibold" aria-label={`Quantity ${qty}`}>
                        {qty}
                      </span>
                      <QtyButton label={`Increase ${p.name}`} onClick={() => setQty(slug, qty + 1)}>
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </QtyButton>
                      <button
                        type="button"
                        onClick={() => remove(slug)}
                        className="ml-2 inline-flex items-center gap-1 text-sm text-muted hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-bold text-forest-900">{formatINR(p.price * qty)}</p>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-3xl bg-white p-5 ring-1 ring-forest-900/5">
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span className="font-bold text-forest-900">{formatINR(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Inclusive of GST. Shipping calculated at checkout.</p>
            <button
              type="button"
              disabled
              className="mt-5 h-12 w-full rounded-full bg-forest-700 font-semibold text-white disabled:opacity-50"
            >
              Checkout
            </button>
            <p className="mt-2 text-center text-xs text-muted">Secure Razorpay checkout is coming soon.</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function QtyButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-full ring-1 ring-forest-700/30 hover:bg-leaf-100"
    >
      {children}
    </button>
  );
}
