// Practitioners and slot generation used until bookings move to PostgreSQL.
// Roles and fees are placeholders: replace them with Ayushmati's real doctors and fees.

import { TIME_ZONE } from "./format";

export type Specialty = "general" | "panchakarma" | "skin-hair" | "lifestyle";

export type Practitioner = {
  id: string;
  title: string;
  specialty: Specialty;
  qualifications: string;
  languages: string[];
  fee: number; // INR per 30-minute video consultation
};

export const PRACTITIONERS: Practitioner[] = [
  {
    id: "physician",
    title: "Senior Ayurveda Physician",
    specialty: "general",
    qualifications: "BAMS, MD (Ayurveda)",
    languages: ["English", "Malayalam", "Hindi"],
    fee: 800,
  },
  {
    id: "panchakarma",
    title: "Panchakarma Specialist",
    specialty: "panchakarma",
    qualifications: "BAMS, MD (Panchakarma)",
    languages: ["English", "Malayalam"],
    fee: 800,
  },
  {
    id: "skin-hair",
    title: "Ayurvedic Skin & Hair Consultant",
    specialty: "skin-hair",
    qualifications: "BAMS",
    languages: ["English", "Hindi"],
    fee: 600,
  },
  {
    id: "lifestyle",
    title: "Yoga & Lifestyle Therapist",
    specialty: "lifestyle",
    qualifications: "MSc Yoga Therapy",
    languages: ["English", "Hindi", "Tamil"],
    fee: 500,
  },
];

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  general: "General Ayurveda",
  panchakarma: "Panchakarma & detox",
  "skin-hair": "Skin & hair",
  lifestyle: "Yoga & lifestyle",
};

export function getPractitioner(id: string): Practitioner | undefined {
  return PRACTITIONERS.find((p) => p.id === id);
}

// Clinic hours in IST, 30-minute slots, Monday to Saturday.
const SESSIONS = [
  ["10:00", "13:00"],
  ["15:00", "18:00"],
] as const;
const SLOT_MINUTES = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function istDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function istWeekday(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00+05:30`).getUTCDay();
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Stand-in for real bookings: deterministically marks some slots as taken so the UI shows realistic gaps.
function isTaken(practitionerId: string, iso: string): boolean {
  let h = 0;
  for (const ch of practitionerId + iso) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4 === 0;
}

export type SlotDay = { date: string; slots: string[] };

/** Open slots (ISO strings with +05:30 offset) for the next `days` clinic days after `from`. */
export function getOpenSlots(practitionerId: string, from: Date = new Date(), days = 3): SlotDay[] {
  const result: SlotDay[] = [];
  const earliest = from.getTime() + 2 * 60 * 60 * 1000; // at least 2 hours' notice
  for (let offset = 0; result.length < days && offset < days + 7; offset++) {
    const date = istDate(new Date(from.getTime() + offset * DAY_MS));
    if (istWeekday(date) === 0) continue; // closed on Sundays
    const slots: string[] = [];
    for (const [start, end] of SESSIONS) {
      for (let m = toMinutes(start); m + SLOT_MINUTES <= toMinutes(end); m += SLOT_MINUTES) {
        const iso = `${date}T${pad(Math.floor(m / 60))}:${pad(m % 60)}:00+05:30`;
        if (new Date(iso).getTime() >= earliest && !isTaken(practitionerId, iso)) slots.push(iso);
      }
    }
    if (slots.length) result.push({ date, slots });
  }
  return result;
}
