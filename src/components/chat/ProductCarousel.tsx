import Link from "next/link";
import type { Category } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ProductVisual } from "@/components/shop/ProductVisual";

export type CarouselProduct = {
  slug: string;
  name: string;
  price: number;
  size: string;
  tagline: string;
  category: Category;
};

export function ProductCarousel({ reason, products }: { reason: string; products: CarouselProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-muted">
        I couldn&apos;t find a matching product. A consultation with one of our doctors is the best next step.
      </p>
    );
  }

  return (
    <section aria-label="Recommended products" className="space-y-3">
      <p className="text-sm text-muted">{reason}</p>
      <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {products.map((p) => (
          <li key={p.slug} className="w-56 shrink-0 snap-start rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-forest-900/5">
            <ProductVisual category={p.category} name={p.name} size="sm" />
            <h4 className="mt-3 font-display text-lg leading-tight text-forest-900">
              <Link href={`/shop/${p.slug}`} className="hover:underline">
                {p.name}
              </Link>
            </h4>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{p.tagline}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-bold text-forest-900">{formatINR(p.price)}</span>
              <AddToCartButton slug={p.slug} name={p.name} compact />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
