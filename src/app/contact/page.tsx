import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { ContactForm } from "@/components/contact/ContactForm";
import { SocialIcon } from "@/components/site/SocialIcon";
import { CONTACT, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${SITE.name} in Kollam: call ${CONTACT.phone}, email ${CONTACT.email}, or send us a message.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: SITE.name,
          url: SITE.url,
          email: CONTACT.email,
          telephone: CONTACT.phoneHref.replace("tel:", ""),
          address: {
            "@type": "PostalAddress",
            streetAddress: CONTACT.address.street,
            addressLocality: CONTACT.address.locality,
            addressRegion: CONTACT.address.region,
            postalCode: CONTACT.address.postalCode,
            addressCountry: "IN",
          },
          openingHoursSpecification: CONTACT.hours.map((h) => ({ "@type": "OpeningHoursSpecification", ...h.schema })),
        }}
      />

      <section className="leaf-pattern">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-14">
          <p className="text-sm font-bold uppercase tracking-wider text-earth">Contact us</p>
          <h1 className="mt-2 font-display text-4xl text-forest-900 sm:text-5xl">We&apos;d love to hear from you</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Feel free to contact us with any questions or concerns. Use the form below or email us directly. We
            appreciate your interest and look forward to hearing from you.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-12 lg:grid-cols-[1fr_24rem]">
        <ContactForm />

        <aside className="space-y-4">
          <InfoCard Icon={Phone} title="Call us">
            <a href={CONTACT.phoneHref} className="font-semibold text-forest-800 hover:underline">
              {CONTACT.phone}
            </a>
          </InfoCard>

          <InfoCard Icon={Mail} title="Email">
            <a href={`mailto:${CONTACT.email}`} className="font-semibold text-forest-800 hover:underline">
              {CONTACT.email}
            </a>
          </InfoCard>

          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-3xl bg-forest-700 p-5 font-semibold text-white shadow-sm transition hover:bg-forest-600"
          >
            <SocialIcon network="whatsapp" className="h-6 w-6" />
            Chat with us on WhatsApp
            <span className="sr-only">(opens in a new tab)</span>
          </a>

          <InfoCard Icon={MapPin} title="Visit us">
            <address className="not-italic leading-relaxed">
              {CONTACT.address.lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <a
              href={CONTACT.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-forest-700 underline"
            >
              Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </InfoCard>

          <InfoCard Icon={Clock} title="Opening hours">
            <dl className="space-y-1 text-sm">
              {CONTACT.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt className="text-muted">{h.days}</dt>
                  <dd className="font-semibold text-forest-900">{h.time}</dd>
                </div>
              ))}
            </dl>
          </InfoCard>
        </aside>
      </div>
    </>
  );
}

function InfoCard({ Icon, title, children }: { Icon: typeof Phone; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-100">
        <Icon className="h-5 w-5 text-forest-700" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold uppercase tracking-wider text-earth">{title}</h2>
        <div className="mt-1 text-ink">{children}</div>
      </div>
    </section>
  );
}
