"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { asset } from "@/lib/site";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/consult", label: "Consult a Doctor" },
  { href: "/assistant", label: "AI Wellness Guide" },
  { href: "/#about", label: "Our Story" },
];

// Pages whose hero runs full-bleed behind the header.
const IMMERSIVE_PATHS = new Set(["/"]);

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const immersive = IMMERSIVE_PATHS.has(pathname);

  useEffect(() => {
    if (!immersive) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [immersive]);

  // Transparent over the hero film; solid once scrolled or when the mobile menu is open.
  const overlay = immersive && !scrolled && !open;
  const iconButton = `inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
    overlay ? "text-white hover:bg-white/15" : "text-forest-800 hover:bg-leaf-100"
  }`;

  return (
    <header
      data-overlay={overlay}
      className={`top-0 z-40 transition-colors duration-300 ${immersive ? "fixed inset-x-0" : "sticky"} ${
        overlay ? "border-b border-transparent bg-transparent" : "border-b border-forest-900/10 bg-cream/90 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20">
        <Link href="/" aria-label="Ayushmati Ayurveda home" className="shrink-0">
          <Image
            src={asset(overlay ? "/logo-light.png" : "/logo.png")}
            alt="Ayushmati"
            width={562}
            height={192}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul
            className={`flex items-center gap-7 text-[15px] font-semibold transition-colors ${
              overlay ? "text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]" : "text-forest-800"
            }`}
          >
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`transition-colors aria-[current=page]:underline aria-[current=page]:underline-offset-8 ${
                    overlay ? "hover:text-leaf-300" : "hover:text-forest-600 aria-[current=page]:text-forest-600"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className={`relative ${iconButton}`} aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-turmeric px-1 text-xs font-bold text-forest-950">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className={`${iconButton} md:hidden`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-forest-900/10 md:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 font-semibold text-forest-800 hover:bg-leaf-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
