"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, Video } from "lucide-react";
import type { Practitioner, SlotDay } from "@/lib/consultations";
import { formatINR, formatSlotDay, formatSlotTime } from "@/lib/format";
import { SlotCalendar } from "@/components/consult/SlotCalendar";

export type BookablePractitioner = Practitioner & { days: SlotDay[] };

export function BookingWidget({
  practitioners,
  reason,
  calendar = false,
}: {
  practitioners: BookablePractitioner[];
  reason?: string;
  /** Month calendar for picking the day (consult page); otherwise a compact row of days (chat). */
  calendar?: boolean;
}) {
  const [practitionerId, setPractitionerId] = useState(practitioners[0]?.id);
  const practitioner = practitioners.find((p) => p.id === practitionerId) ?? practitioners[0];
  const [date, setDate] = useState<string | undefined>(practitioner?.days[0]?.date);
  const [slot, setSlot] = useState<string>();

  if (!practitioner) return null;
  const day = practitioner.days.find((d) => d.date === date) ?? practitioner.days[0];

  function choosePractitioner(id: string) {
    const next = practitioners.find((p) => p.id === id);
    setPractitionerId(id);
    setDate(next?.days[0]?.date);
    setSlot(undefined);
  }

  return (
    <section aria-label="Book a consultation" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-forest-900/5">
      {reason && <p className="mb-3 text-sm text-muted">{reason}</p>}

      {practitioners.length > 1 && (
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-earth">Practitioner</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {practitioners.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.id === practitioner.id}
                onClick={() => choosePractitioner(p.id)}
                className="rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-forest-700/30 transition aria-pressed:bg-forest-700 aria-pressed:text-white"
              >
                {p.title}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-3 flex items-start gap-3 rounded-xl bg-leaf-100 p-3">
        <Video className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" aria-hidden />
        <div className="text-sm">
          <p className="font-bold text-forest-900">{practitioner.title}</p>
          <p className="text-muted">
            {practitioner.qualifications} · {practitioner.languages.join(", ")}
          </p>
          <p className="mt-1 font-semibold text-forest-800">{formatINR(practitioner.fee)} · 30-minute video consultation</p>
        </div>
      </div>

      {practitioner.days.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No open slots in the next few days. Please check back soon.</p>
      ) : (
        <>
          {calendar ? (
            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-earth">Date</legend>
              <SlotCalendar
                key={practitioner.id}
                days={practitioner.days}
                selected={day?.date}
                onSelect={(d) => {
                  setDate(d);
                  setSlot(undefined);
                }}
              />
            </fieldset>
          ) : (
            <fieldset className="mt-4">
              <legend className="text-xs font-bold uppercase tracking-wider text-earth">Day</legend>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {practitioner.days.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    aria-pressed={d.date === day?.date}
                    onClick={() => {
                      setDate(d.date);
                      setSlot(undefined);
                    }}
                    className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-forest-700/30 transition aria-pressed:bg-forest-700 aria-pressed:text-white"
                  >
                    {formatSlotDay(d.slots[0])}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="mt-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-earth">
              Time (IST){calendar && day ? ` · ${formatSlotDay(day.slots[0])}` : ""}
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {day?.slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === slot}
                  onClick={() => setSlot(s)}
                  className="rounded-lg px-2 py-2 text-sm ring-1 ring-forest-700/20 transition hover:bg-leaf-100 aria-pressed:bg-leaf-500 aria-pressed:font-bold aria-pressed:text-forest-950"
                >
                  {formatSlotTime(s)}
                </button>
              ))}
            </div>
          </fieldset>

          {slot ? (
            <Link
              href={`/consult?practitioner=${practitioner.id}&slot=${encodeURIComponent(slot)}#booking`}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-forest-700 font-semibold text-white hover:bg-forest-600"
            >
              <CalendarCheck className="h-4 w-4" aria-hidden />
              Continue with {formatSlotDay(slot)}, {formatSlotTime(slot)}
            </Link>
          ) : (
            <p className="mt-4 text-center text-sm text-muted">Choose a time to continue.</p>
          )}
        </>
      )}
    </section>
  );
}
