import { PRACTITIONERS, getOpenSlots, getPractitioner } from "./consultations";

// Monday 20 Oct 2026, 08:00 IST
const MONDAY_MORNING = new Date("2026-10-20T08:00:00+05:30");

describe("getOpenSlots", () => {
  it("returns the requested number of clinic days, skipping Sundays", () => {
    const saturday = new Date("2026-10-24T08:00:00+05:30");
    const days = getOpenSlots("physician", saturday, 2);
    expect(days.map((d) => d.date)).toEqual(["2026-10-24", "2026-10-26"]);
  });

  it("only offers 30-minute slots inside clinic hours, in IST", () => {
    for (const { slots } of getOpenSlots("physician", MONDAY_MORNING)) {
      for (const s of slots) {
        expect(s).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:(00|30):00\+05:30$/);
        const hhmm = s.slice(11, 16);
        const inMorning = hhmm >= "10:00" && hhmm <= "12:30";
        const inAfternoon = hhmm >= "15:00" && hhmm <= "17:30";
        expect(inMorning || inAfternoon).toBe(true);
      }
    }
  });

  it("requires at least two hours' notice", () => {
    const now = new Date("2026-10-20T11:10:00+05:30");
    const [today] = getOpenSlots("physician", now);
    expect(today.date).toBe("2026-10-20");
    for (const s of today.slots) expect(new Date(s).getTime()).toBeGreaterThanOrEqual(now.getTime() + 2 * 3600_000);
  });

  it("moves to the next day after clinic hours", () => {
    const [first] = getOpenSlots("physician", new Date("2026-10-20T19:00:00+05:30"));
    expect(first.date).toBe("2026-10-21");
  });

  it("is deterministic and leaves some slots taken", () => {
    const a = getOpenSlots("skin-hair", MONDAY_MORNING);
    expect(getOpenSlots("skin-hair", MONDAY_MORNING)).toEqual(a);
    const total = a.reduce((n, d) => n + d.slots.length, 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(a.length * 12);
  });
});

describe("getPractitioner", () => {
  it("looks practitioners up by id", () => {
    expect(getPractitioner(PRACTITIONERS[0].id)).toBe(PRACTITIONERS[0]);
    expect(getPractitioner("unknown")).toBeUndefined();
  });
});
