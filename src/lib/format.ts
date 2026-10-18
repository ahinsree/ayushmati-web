export const TIME_ZONE = "Asia/Kolkata";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatINR(amount: number): string {
  return inr.format(amount);
}

export function formatSlotDay(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, weekday: "short", day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

export function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(
    new Date(iso),
  );
}
