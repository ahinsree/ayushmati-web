import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { CATEGORIES, PRODUCTS, getProduct } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { SITE } from "@/lib/site";

// Only the catalogue's products exist; anything else is a 404 (also required for static export).
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: `${product.tagline} ${product.description}`.slice(0, 160),
    alternates: { canonical: `/shop/${product.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const related = PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.concerns.some((c) => product.concerns.includes(c)),
  ).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          brand: { "@type": "Brand", name: "Ayushmati" },
          category: CATEGORIES[product.category].label,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: `${SITE.url}/shop/${product.slug}`,
          },
        }}
      />

      <Link href={`/shop?category=${product.category}`} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
        <ChevronLeft className="h-4 w-4" aria-hidden /> {CATEGORIES[product.category].label}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductVisual category={product.category} name={product.name} size="lg" />
        <div>
          <h1 className="font-display text-4xl text-forest-900">{product.name}</h1>
          <p className="mt-2 text-lg text-muted">{product.tagline}</p>
          <p className="mt-6">
            <span className="text-3xl font-bold text-forest-900">{formatINR(product.price)}</span>
            <span className="ml-2 text-muted">{product.size} · incl. GST</span>
          </p>
          <div className="mt-6">
            <AddToCartButton slug={product.slug} name={product.name} />
          </div>

          <div className="mt-10 space-y-6">
            <Detail title="About">{product.description}</Detail>
            <Detail title="Key ingredients">
              <ul className="flex flex-wrap gap-2">
                {product.ingredients.map((i) => (
                  <li key={i} className="rounded-full bg-leaf-100 px-3 py-1 text-sm text-forest-800">
                    {i}
                  </li>
                ))}
              </ul>
            </Detail>
            <Detail title="How to use">{product.usage}</Detail>
            <Detail title="Balances">
              <span className="capitalize">{product.doshas.join(", ")}</span>
            </Detail>
          </div>

          <p className="mt-8 rounded-2xl bg-sand p-4 text-sm text-muted">
            Pregnant, breastfeeding, or on regular medication?{" "}
            <Link href="/consult" className="font-semibold text-forest-700 underline">
              Consult one of our doctors
            </Link>{" "}
            before starting any new remedy.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display text-3xl text-forest-900">
            Pairs well with
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-earth">{title}</h2>
      <div className="mt-2 leading-relaxed text-ink">{children}</div>
    </section>
  );
}
