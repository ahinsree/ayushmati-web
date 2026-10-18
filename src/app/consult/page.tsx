import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultBooking, ConsultBookingSkeleton } from "@/components/consult/ConsultBooking";
import { PRACTITIONERS, SPECIALTY_LABELS } from "@/lib/consultations";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Online Ayurvedic Consultations",
  description: "Book a 30-minute video consultation with Ayushmati's Ayurvedic doctors and therapists.",
  alternates: { canonical: "/consult" },
};

export default function ConsultPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-4xl text-forest-900">Consult an Ayurvedic doctor</h1>
      <p className="mt-2 max-w-2xl text-muted">
        30-minute video consultations with our physicians and therapists. You&apos;ll get a personalised plan covering
        diet, lifestyle and, where needed, classical medicines.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_26rem]">
        <ul className="grid h-fit gap-4 sm:grid-cols-2">
          {PRACTITIONERS.map((p) => (
            <li key={p.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
              <p className="text-xs font-bold uppercase tracking-wider text-earth">{SPECIALTY_LABELS[p.specialty]}</p>
              <h2 className="mt-1 font-display text-xl text-forest-900">{p.title}</h2>
              <p className="mt-1 text-sm text-muted">{p.qualifications}</p>
              <p className="mt-1 text-sm text-muted">Speaks {p.languages.join(", ")}</p>
              <p className="mt-3 font-semibold text-forest-800">{formatINR(p.fee)} / 30 min</p>
            </li>
          ))}
        </ul>

        <div id="booking" className="scroll-mt-24">
          <Suspense fallback={<ConsultBookingSkeleton />}>
            <ConsultBooking />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
