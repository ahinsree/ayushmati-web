import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Leaf, Sprout, Stethoscope } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { TEAM, initials, type TeamMember } from "@/lib/team";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Ayushmati: four decades of Ayurvedic care founded by Dr. V. Jayadevan and led today by Chief Physician Dr. J. Geethanand.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { Icon: Leaf, title: "Rooted in tradition", text: "Generations of Ayurvedic expertise and classical, natural remedies." },
  { Icon: Sprout, title: "Enriched by innovation", text: "Ancient wisdom combined with modern practice and medicine." },
  { Icon: HeartHandshake, title: "Care and compassion", text: "Personalised treatment that puts each patient's well-being first." },
  { Icon: Stethoscope, title: "Doctors grown from within", text: "We nurture our own teams instead of outsourcing care." },
];

const GROUPS: { key: TeamMember["group"]; title: string; blurb: string }[] = [
  { key: "leadership", title: "Leadership", blurb: "The vision and guidance behind Ayushmati." },
  { key: "physicians", title: "Physicians", blurb: "Ayurveda and modern medicine, side by side." },
  { key: "visiting", title: "Visiting consultants", blurb: "Specialists who see patients at Ayushmati on scheduled visits." },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `About ${SITE.name}`,
          url: `${SITE.url}/about`,
          about: {
            "@type": "MedicalOrganization",
            name: SITE.name,
            founder: { "@type": "Person", name: "Dr. V. Jayadevan" },
            employee: TEAM.filter((m) => !m.late).map((m) => ({ "@type": "Person", name: m.name, jobTitle: m.role })),
          },
        }}
      />

      <section className="leaf-pattern">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14">
          <p className="text-sm font-bold uppercase tracking-wider text-earth">About us</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl text-forest-900 sm:text-5xl">Get to know us</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            For over four decades, Ayushmati has combined the wisdom of Ayurveda with modern practice to transform lives.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16" aria-labelledby="legacy-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="legacy-heading" className="font-display text-3xl text-forest-900">
              Our legacy of Ayurveda
            </h2>
            <p className="mt-4 leading-relaxed text-ink">
              At Ayushmati, our roots trace back to generations of Ayurvedic expertise, founded by{" "}
              <strong>Dr. V. Jayadevan</strong>. Guided by ancient traditions and enriched by innovation, we prioritise
              holistic well-being through personalised treatments and natural remedies.
            </p>
            <p className="mt-4 leading-relaxed text-ink">
              For over four decades, we have combined the wisdom of Ayurveda with modern practices to transform lives,
              ensuring care that is compassionate, effective, and deeply rooted in heritage.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 self-start">
            <Stat value="40+" label="years of Ayurvedic care" />
            <Stat value={String(TEAM.length)} label="doctors and consultants" />
            <div className="col-span-2 rounded-3xl bg-forest-800 p-5 text-white">
              <p className="font-display text-2xl">Ayurveda, homeopathy and modern medicine</p>
              <p className="mt-1 text-sm text-leaf-100/85">under one roof, with your well-being first.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="culture-heading">
        <h2 id="culture-heading" className="font-display text-3xl text-forest-900">
          People and culture
        </h2>
        <div className="mt-4 grid gap-6 leading-relaxed text-ink lg:grid-cols-2">
          <p>
            Our people are what make us unique. Through all these years, our vision has been the utmost well-being of
            society, by sharing our knowledge and enriching lives through lifestyle changes. We extend extreme care and
            compassion to everyone who seeks our expertise, and by nurturing our teams from within rather than relying on
            external outsourcing, we make sure our doctors are empowered and aligned with our values.
          </p>
          <p>
            Founded by <strong>Dr. V. Jayadevan</strong>, whose vision laid the groundwork for our values, Ayushmati is now
            led by <strong>Chief Physician Dr. J. Geethanand</strong>, supported by <strong>Dr. Bhavya G. Anand</strong>.
            Modern medicine is part of our care through <strong>Dr. Silpa B. Panicker</strong>, and we benefit from the
            guidance of <strong>Dr. Prabha V.</strong>, whose deep knowledge of medicine enriches our Ayurvedic practice.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-leaf-100">
                <Icon className="h-5 w-5 text-forest-700" aria-hidden />
              </span>
              <h3 className="mt-4 font-bold text-forest-900">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="team-heading">
        <h2 id="team-heading" className="font-display text-3xl text-forest-900">
          Our doctors
        </h2>
        {GROUPS.map((g) => (
          <div key={g.key} className="mt-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-earth">{g.title}</h3>
            <p className="mt-1 text-sm text-muted">{g.blurb}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.filter((m) => m.group === g.key).map((m) => (
                <li key={m.name} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-xl ${
                      m.late ? "bg-sand text-earth" : "bg-forest-700 text-white"
                    }`}
                    aria-hidden
                  >
                    {initials(m.name)}
                  </span>
                  <div>
                    <p className="font-display text-xl leading-tight text-forest-900">
                      {m.late && <span className="text-base text-muted">Late </span>}
                      {m.name}
                    </p>
                    <p className="text-sm font-semibold text-forest-700">{m.role}</p>
                    {m.qualifications && <p className="text-sm text-muted">{m.qualifications}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-forest-900 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-3xl">Join us in embracing holistic wellness and healing.</h2>
            <p className="mt-2 text-leaf-100/85">Book a consultation online, or visit us in Kollam.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/consult"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-leaf-500 px-6 font-semibold text-forest-950 hover:bg-leaf-300"
            >
              Consult a doctor <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/contact" className="inline-flex h-12 items-center rounded-full px-6 font-semibold ring-1 ring-white/40 hover:bg-white/10">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl bg-sand p-5">
      <p className="font-display text-4xl text-forest-700">{value}</p>
      <p className="mt-1 text-sm text-ink">{label}</p>
    </div>
  );
}
