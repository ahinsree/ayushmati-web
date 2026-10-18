"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { BookingWidget, type BookablePractitioner } from "@/components/chat/BookingWidget";
import { PRACTITIONERS, getOpenSlots, getPractitioner } from "@/lib/consultations";
import { formatINR, formatSlotDay, formatSlotTime } from "@/lib/format";

// Open slots depend on the current time, so they're computed in the browser after mount.
// That keeps /consult a static page (it also works in the GitHub Pages demo).
export function ConsultBooking() {
  const params = useSearchParams();
  const [practitioners, setPractitioners] = useState<BookablePractitioner[]>();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPractitioners(PRACTITIONERS.map((p) => ({ ...p, days: getOpenSlots(p.id) })));
  }, []);

  if (!practitioners) return <ConsultBookingSkeleton />;

  const chosen = getPractitioner(params.get("practitioner") ?? "");
  const slot = params.get("slot");
  const chosenSlot =
    chosen && slot && practitioners.find((p) => p.id === chosen.id)?.days.some((d) => d.slots.includes(slot)) ? slot : undefined;

  return (
    <div className="space-y-4">
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
          <p className="mt-2 text-center text-xs text-muted">Online payment and instant confirmation are coming soon.</p>
        </section>
      )}
      <BookingWidget
        key={chosen?.id ?? "all"}
        practitioners={
          chosen
            ? [...practitioners.filter((p) => p.id === chosen.id), ...practitioners.filter((p) => p.id !== chosen.id)]
            : practitioners
        }
      />
    </div>
  );
}

export function ConsultBookingSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 text-sm text-muted shadow-sm ring-1 ring-forest-900/5" aria-busy="true">
      Loading available times…
    </div>
  );
}
