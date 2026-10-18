import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/catalog";

export function Footer() {
  return (
    <footer className="mt-24 bg-forest-900 text-leaf-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl text-white">āyushmati</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-leaf-100/80">
            A 5,000-year-old tradition of healing, crafted in-house and made for modern life.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-leaf-300">Shop</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(Object.keys(CATEGORIES) as Category[]).map((c) => (
              <li key={c}>
                <Link href={`/shop?category=${c}`} className="hover:text-white">
                  {CATEGORIES[c].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-leaf-300">Care</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/consult" className="hover:text-white">
                Online consultations
              </Link>
            </li>
            <li>
              <Link href="/assistant" className="hover:text-white">
                AI wellness guide
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-leaf-100/70">
          Information on this site, including the AI wellness guide, is for general wellness education and is not a
          substitute for professional medical advice. In an emergency, call 112. © {new Date().getFullYear()} Ayushmati
          Ayurveda.
        </p>
      </div>
    </footer>
  );
}
