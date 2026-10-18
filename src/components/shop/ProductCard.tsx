import Link from "next/link";
import { CATEGORIES, type Product } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";
import { ProductVisual } from "./ProductVisual";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-forest-900/5 transition hover:shadow-md">
      <Link href={`/shop/${product.slug}`} className="block">
        <ProductVisual category={product.category} name={product.name} />
      </Link>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-earth">{CATEGORIES[product.category].label}</p>
        <h3 className="mt-1 font-display text-xl text-forest-900">
          <Link href={`/shop/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 flex-1 text-sm text-muted">{product.tagline}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="min-w-0 leading-tight">
            <span className="block text-lg font-bold text-forest-900">{formatINR(product.price)}</span>
            <span className="block truncate text-xs text-muted">{product.size}</span>
          </p>
          <AddToCartButton slug={product.slug} name={product.name} compact />
        </div>
      </div>
    </article>
  );
}
