"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SlotDay } from "@/lib/consultations";
import { TIME_ZONE } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Month = { y: number; m: number }; // m is 0-based

const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthOf = (date: string): Month => ({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 });
const monthIndex = ({ y, m }: Month) => y * 12 + m;
const fromIndex = (i: number): Month => ({ y: Math.floor(i / 12), m: i % 12 });

const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

/**
 * Month calendar for choosing a consultation day. Dates are IST calendar dates ("YYYY-MM-DD").
 * Only days with open slots can be picked; navigation is limited to the months that have them.
 */
export function SlotCalendar({
  days,
  selected,
  onSelect,
}: {
  days: SlotDay[];
  selected?: string;
  onSelect: (date: string) => void;
}) {
  const slotsByDate = new Map(days.map((d) => [d.date, d.slots.length]));
  const first = days[0]?.date;
  const last = days.at(-1)?.date;
  const [view, setView] = useState<Month>(() => monthOf(selected ?? first ?? todayIST()));

  if (!first || !last) return null;

  const minIndex = monthIndex(monthOf(first));
  const maxIndex = monthIndex(monthOf(last));
  const current = monthIndex(view);
  const leading = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const today = todayIST();

  return (
    <div className="rounded-xl ring-1 ring-forest-700/15">
      <div className="flex items-center justify-between px-2 py-2">
        <button
          type="button"
          onClick={() => setView(fromIndex(current - 1))}
          disabled={current <= minIndex}
          aria-label="Previous month"
          className="grid h-9 w-9 place-items-center rounded-full text-forest-800 hover:bg-leaf-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <p className="font-display text-lg text-forest-900" aria-live="polite">
          {monthLabel.format(Date.UTC(view.y, view.m, 1))}
        </p>
        <button
          type="button"
          onClick={() => setView(fromIndex(current + 1))}
          disabled={current >= maxIndex}
          aria-label="Next month"
          className="grid h-9 w-9 place-items-center rounded-full text-forest-800 hover:bg-leaf-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 pb-2 text-center" role="group" aria-label="Choose a day">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 text-[11px] font-bold uppercase tracking-wider text-earth" aria-hidden>
            {w}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const date = key(view.y, view.m, d);
          const count = slotsByDate.get(date) ?? 0;
          const isSelected = date === selected;
          const label = `${dayLabel.format(Date.UTC(view.y, view.m, d))}, ${
            count ? `${count} time${count === 1 ? "" : "s"} available` : "unavailable"
          }`;
          return (
            <button
              key={date}
              type="button"
              disabled={!count}
              aria-pressed={isSelected}
              aria-label={label}
              onClick={() => onSelect(date)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                isSelected
                  ? "bg-forest-700 font-bold text-white"
                  : count
                    ? "font-semibold text-forest-900 hover:bg-leaf-100"
                    : "text-muted/40"
              } ${date === today && !isSelected ? "ring-1 ring-turmeric" : ""}`}
            >
              {d}
              {count > 0 && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? "bg-leaf-300" : "bg-leaf-500"}`}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
