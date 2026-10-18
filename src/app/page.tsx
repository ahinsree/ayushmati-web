import Link from "next/link";
import { ArrowRight, CalendarCheck, FlaskConical, Leaf, MessageCircleHeart, ShieldCheck, Stethoscope, Video } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { HeroVideo } from "@/components/HeroVideo";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { CATEGORIES, getFeaturedProducts, type Category } from "@/lib/catalog";
import { SITE } from "@/lib/site";

const TRUST = [
  { Icon: FlaskConical, label: "Crafted in-house" },
  { Icon: Leaf, label: "Classical formulations" },
  { Icon: Stethoscope, label: "Expert Ayurvedic doctors" },
  { Icon: ShieldCheck, label: "Secure online consultations" },
];

const DOSHAS = [
  { name: "Vata", elements: "Air & space", text: "Movement, creativity and the nervous system. Out of balance: dryness, anxiety, poor sleep." },
  { name: "Pitta", elements: "Fire & water", text: "Digestion, metabolism and focus. Out of balance: acidity, inflammation, irritability." },
  { name: "Kapha", elements: "Earth & water", text: "Structure, stamina and calm. Out of balance: sluggishness, congestion, weight gain." },
];

const STEPS = [
  { Icon: MessageCircleHeart, title: "Share your concern", text: "Start with our AI guide or choose a specialist directly." },
  { Icon: CalendarCheck, title: "Pick a time", text: "See real-time availability and book a 30-minute slot." },
  { Icon: Video, title: "Consult by video", text: "Meet your doctor online and receive a personalised plan." },
];

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
          logo: `${SITE.url}/logo.png`,
          description: SITE.description,
        }}
      />

      {/* Full-screen hero: the introductory film plays behind the header and copy */}
      <HeroVideo id={SITE.introVideoId} start={SITE.introVideoStart} focusX={0.85} title="Discover Ayushmati">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-leaf-100 ring-1 ring-white/25 backdrop-blur">
          <Leaf className="h-4 w-4" aria-hidden /> 5,000 years of Ayurveda
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
          Ancient wisdom for <span className="italic text-leaf-300">modern wellness</span>
        </h1>
        <p className="mt-4 max-w-lg leading-relaxed text-white/90 drop-shadow-sm sm:text-lg">
          Authentic Ayurvedic medicines, herbal skincare and hair care crafted in our own facility, and expert doctors
          who see you as a whole person, now online.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-leaf-500 px-6 font-semibold text-forest-950 shadow-sm hover:bg-leaf-300"
          >
            Shop remedies <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/consult"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-forest-800 hover:bg-leaf-100"
          >
            Consult a doctor
          </Link>
        </div>
      </HeroVideo>

      {/* Trust bar */}
      <section aria-label="Why Ayushmati" className="border-y border-forest-900/10 bg-white">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-6 lg:grid-cols-4">
          {TRUST.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm font-semibold text-forest-800">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf-100">
                <Icon className="h-5 w-5 text-forest-700" aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="font-display text-3xl text-forest-900 sm:text-4xl">
          Shop by need
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {(Object.keys(CATEGORIES) as Category[]).map((c) => (
            <li key={c}>
              <Link href={`/shop?category=${c}`} className="group block">
                <ProductVisual category={c} name={CATEGORIES[c].label} />
                <h3 className="mt-3 font-display text-xl text-forest-900 group-hover:underline">{CATEGORIES[c].label}</h3>
                <p className="text-sm text-muted">{CATEGORIES[c].blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="featured-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="featured-heading" className="font-display text-3xl text-forest-900 sm:text-4xl">
            Customer favourites
          </h2>
          <Link href="/shop" className="font-semibold text-forest-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* AI guide */}
      <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="guide-heading">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-forest-900 p-8 text-white sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-leaf-300">New · AI Wellness Guide</p>
            <h2 id="guide-heading" className="mt-3 font-display text-3xl sm:text-4xl">
              A preliminary consultation, any time of day
            </h2>
            <p className="mt-4 leading-relaxed text-leaf-100/85">
              Describe how you feel. Our guide asks a few questions the way an Ayurvedic vaidya would, explains your dosha
              balance, and suggests remedies, a daily routine or a doctor, right inside the chat.
            </p>
            <Link
              href="/assistant"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-leaf-500 px-6 font-semibold text-forest-950 hover:bg-leaf-300"
            >
              Start a conversation <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div aria-hidden className="space-y-3 rounded-3xl bg-cream p-5 text-sm text-ink shadow-xl">
            <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-forest-700 px-4 py-2.5 text-white">
              I&apos;ve been feeling anxious and can&apos;t sleep well.
            </p>
            <p className="w-fit max-w-[85%] rounded-2xl bg-white px-4 py-2.5 shadow-sm">
              That sounds like Vata may be elevated. How is your digestion, and do you wake at a particular time?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <ProductVisual category="supplements" name="" size="sm" />
                <p className="mt-2 font-semibold">Ashwagandha</p>
              </div>
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <ProductVisual category="haircare" name="" size="sm" />
                <p className="mt-2 font-semibold">Neelibhringadi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consultations */}
      <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="consult-heading">
        <h2 id="consult-heading" className="font-display text-3xl text-forest-900 sm:text-4xl">
          See an Ayurvedic doctor from home
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-leaf-100">
                  <Icon className="h-5 w-5 text-forest-700" aria-hidden />
                </span>
                <span className="font-display text-3xl text-leaf-500">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-forest-900">{title}</h3>
              <p className="mt-1 text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <Link href="/consult" className="mt-8 inline-flex items-center gap-2 font-semibold text-forest-700 hover:underline">
          Meet our practitioners <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      {/* Story and doshas */}
      <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-20" aria-labelledby="about-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="about-heading" className="font-display text-3xl text-forest-900 sm:text-4xl">
              The science of life
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Ayurveda, the 5,000-year-old science of life, sees health as balance between body, mind and spirit. At
              Ayushmati we prepare classical formulations in-house and pair them with personal guidance, so that this
              tradition fits the pace of modern life.
            </p>
            <Link href="/about" className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-700 hover:underline">
              Meet our doctors <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {DOSHAS.map((d) => (
              <li key={d.name} className="rounded-3xl bg-sand p-5">
                <p className="font-display text-2xl text-forest-900">{d.name}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-earth">{d.elements}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink">{d.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
