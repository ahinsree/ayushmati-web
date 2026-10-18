import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingWidget } from "@/components/chat/BookingWidget";
import { Footer } from "@/components/site/Footer";
import { PRACTITIONERS, getOpenSlots } from "@/lib/consultations";
import { SOCIAL_LINKS } from "@/lib/site";
import { SlotCalendar } from "./SlotCalendar";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-unused-vars
  default: ({ fill, priority, ...props }: Record<string, unknown>) => <img alt="" {...props} />,
}));

// Build day labels with the same formatter as the component: ICU output differs between Node versions
// (e.g. "Friday 30 October" vs "Friday, 30 October").
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const dayName = (y: number, m: number, d: number, rest: string) =>
  new RegExp(`^${escape(`${dayFmt.format(Date.UTC(y, m - 1, d))}, ${rest}`)}$`, "i");

const DAYS = [
  { date: "2026-10-30", slots: ["2026-10-30T10:00:00+05:30", "2026-10-30T10:30:00+05:30"] },
  { date: "2026-11-02", slots: ["2026-11-02T15:00:00+05:30"] },
];

describe("SlotCalendar", () => {
  it("shows the month of the first open day, with only open days selectable", () => {
    render(<SlotCalendar days={DAYS} onSelect={() => {}} />);
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dayName(2026, 10, 30, "2 times available") })).toBeEnabled();
    expect(screen.getByRole("button", { name: dayName(2026, 10, 31, "unavailable") })).toBeDisabled();
    expect(screen.getByRole("button", { name: /previous month/i })).toBeDisabled();
  });

  it("navigates to the next month and reports the chosen date", async () => {
    const onSelect = vi.fn();
    render(<SlotCalendar days={DAYS} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next month/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: dayName(2026, 11, 2, "1 time available") }));
    expect(onSelect).toHaveBeenCalledWith("2026-11-02");
  });

  it("marks the selected day", () => {
    render(<SlotCalendar days={DAYS} selected="2026-10-30" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /30 october/i })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("BookingWidget in calendar mode", () => {
  it("picks a date on the calendar, then a time, then continues to booking", async () => {
    const from = new Date("2026-10-20T08:00:00+05:30");
    const practitioners = [{ ...PRACTITIONERS[0], days: getOpenSlots(PRACTITIONERS[0].id, from, 30) }];
    render(<BookingWidget calendar practitioners={practitioners} />);

    const target = practitioners[0].days[3];
    const [y, m, d] = target.date.split("-").map(Number);
    if (m !== 10) await userEvent.click(screen.getByRole("button", { name: /next month/i }));
    await userEvent.click(screen.getByRole("button", { name: new RegExp(`^${escape(dayFmt.format(Date.UTC(y, m - 1, d)))},`) }));

    const timeButtons = screen.getAllByRole("button").filter((b) => /^\d{1,2}:\d\d\s?[ap]m$/i.test(b.textContent ?? ""));
    expect(timeButtons).toHaveLength(target.slots.length);
    await userEvent.click(timeButtons[0]);
    expect(screen.getByRole("link", { name: /continue with/i }).getAttribute("href")).toContain(
      encodeURIComponent(target.slots[0]),
    );
  });
});

describe("Footer", () => {
  it("shows the logo and opens WhatsApp, Instagram and LinkedIn in a new tab", () => {
    render(<Footer />);
    expect(screen.getByRole("img", { name: "Ayushmati" })).toBeInTheDocument();
    for (const { label, href } of SOCIAL_LINKS) {
      const link = screen.getByRole("link", { name: new RegExp(label) });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
