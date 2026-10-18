"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, getProductsByCategory, isCategory, type Category } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

/** Product grid filtered by `?category=` (read in the browser so the page can be fully static). */
export function ShopCatalogFromUrl() {
  const raw = useSearchParams().get("category");
  return <ShopCatalog category={isCategory(raw) ? raw : undefined} />;
}

export function ShopCatalog({ category }: { category?: Category }) {
  const products = getProductsByCategory(category);

  return (
    <>
      <h1 className="font-display text-4xl text-forest-900">{category ? CATEGORIES[category].label : "Shop all"}</h1>
      <p className="mt-2 text-muted">
        {category ? CATEGORIES[category].blurb : "Classical Ayurvedic formulations, prepared in-house."}
      </p>

      <nav aria-label="Categories" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <FilterLink href="/shop" active={!category} label="All" />
          {(Object.keys(CATEGORIES) as Category[]).map((c) => (
            <FilterLink key={c} href={`/shop?category=${c}`} active={category === c} label={CATEGORIES[c].label} />
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="inline-block rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-forest-700/25 transition hover:bg-leaf-100 aria-[current=page]:bg-forest-700 aria-[current=page]:text-white"
      >
        {label}
      </Link>
    </li>
  );
}
