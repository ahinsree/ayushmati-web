import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/catalog";
import { CONTACT, SITE, SOCIAL_LINKS, asset } from "@/lib/site";
import { SocialIcon } from "./SocialIcon";

export function Footer() {
  return (
    <footer className="mt-24 bg-forest-900 text-leaf-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" aria-label="Ayushmati home" className="inline-block">
            <Image src={asset("/logo-light.png")} alt="Ayushmati" width={392} height={152} className="h-12 w-auto" />
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-leaf-100/80">
            A 5,000-year-old tradition of healing, crafted in-house and made for modern life.
          </p>
          <ul className="mt-6 flex gap-3" aria-label="Ayushmati on social media">
            {SOCIAL_LINKS.map(({ network, label, href }) => (
              <li key={network}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  title={label}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-leaf-500 hover:text-forest-950"
                >
                  <SocialIcon network={network} />
                </a>
              </li>
            ))}
          </ul>
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
            <li>
              <Link href="/about" className="hover:text-white">
                About us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-leaf-300">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={CONTACT.phoneHref} className="hover:text-white">
                {CONTACT.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="break-all hover:text-white">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <address className="not-italic leading-relaxed text-leaf-100/80">
                {CONTACT.address.lines.slice(1).join(", ")}
              </address>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-leaf-100/70">
          Information on this site, including the AI wellness guide, is for general wellness education and is not a
          substitute for professional medical advice. In an emergency, call 112. ©{" "}
          {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
