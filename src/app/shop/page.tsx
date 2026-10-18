import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopCatalog, ShopCatalogFromUrl } from "@/components/shop/ShopCatalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Ayurvedic medicines, herbal skincare, hair care and supplements, crafted in-house by Ayushmati.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      {/* The prerendered HTML shows every product; the category filter applies in the browser. */}
      <Suspense fallback={<ShopCatalog />}>
        <ShopCatalogFromUrl />
      </Suspense>
    </div>
  );
}
