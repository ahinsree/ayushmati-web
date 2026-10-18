import type { MetadataRoute } from "next";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/shop", "/consult", "/assistant", "/about", "/contact"].map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const categories = Object.keys(CATEGORIES).map((c) => ({ url: `${SITE.url}/shop?category=${c}`, priority: 0.7 }));
  const products = PRODUCTS.map((p) => ({ url: `${SITE.url}/shop/${p.slug}`, priority: 0.6 }));
  return [...pages, ...categories, ...products];
}
