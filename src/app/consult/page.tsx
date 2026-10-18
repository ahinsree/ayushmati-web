import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { BookingWidget } from "@/components/chat/BookingWidget";
import { PRACTITIONERS, SPECIALTY_LABELS, getOpenSlots, getPractitioner } from "@/lib/consultations";
import { formatINR, formatSlotDay, formatSlotTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Online Ayurvedic Consultations",
  description: "Book a 30-minute video consultation with Ayushmati's Ayurvedic doctors and therapists.",
  alternates: { canonical: "/consult" },
};

// Slots depend on the current time, so render on each request.
export const dynamic = "force-dynamic";

export default async function ConsultPage({ searchParams }: PageProps<"/consult">) {
  const { practitioner: practitionerId, slot } = await searchParams;
  const chosen = typeof practitionerId === "string" ? getPractitioner(practitionerId) : undefined;
  const chosenSlot =
    chosen && typeof slot === "string" && getOpenSlots(chosen.id).some((d) => d.slots.includes(slot)) ? slot : undefined;

  const practitioners = PRACTITIONERS.map((p) => ({ ...p, days: getOpenSlots(p.id) }));

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

        <div id="booking" className="scroll-mt-24 space-y-4">
          {chosen && chosenSlot && (
            <section aria-label="Your selection" className="rounded-2xl bg-leaf-100 p-4">
              <p className="flex items-center gap-2 font-bold text-forest-900">
                <CalendarCheck className="h-5 w-5" aria-hidden /> {chosen.title}
              </p>
              <p className="mt-1 text-forest-800">
                {formatSlotDay(chosenSlot)} at {formatSlotTime(chosenSlot)} IST · {formatINR(chosen.fee)}
              </p>
              <button
                type="button"
                disabled
                className="mt-3 h-11 w-full rounded-full bg-forest-700 font-semibold text-white disabled:opacity-50"
              >
                Confirm &amp; pay
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                Online payment and instant confirmation are coming soon.
              </p>
            </section>
          )}
          <BookingWidget practitioners={practitioners} />
        </div>
      </div>
    </div>
  );
}
