// Server-side pricing: amounts are always recalculated from the catalogue and practitioner
// fees, never taken from the browser.

import { getProduct } from "@/lib/catalog";
import { getOpenSlots, getPractitioner } from "@/lib/consultations";
import { formatSlotDay, formatSlotTime } from "@/lib/format";

export const MAX_QTY_PER_ITEM = 10;
export const BOOKING_WINDOW_DAYS = 30;

export type PricedItem = { slug: string; name: string; qty: number; unitPaise: number };

export type PricedCart = { items: PricedItem[]; totalPaise: number; description: string };

export class PricingError extends Error {}

export function priceCart(lines: { slug: string; qty: number }[]): PricedCart {
  if (lines.length === 0) throw new PricingError("Your cart is empty.");
  const merged = new Map<string, number>();
  for (const { slug, qty } of lines) merged.set(slug, (merged.get(slug) ?? 0) + qty);

  const items = [...merged].map(([slug, qty]) => {
    const product = getProduct(slug);
    if (!product) throw new PricingError("An item in your cart is no longer available.");
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) throw new PricingError("Invalid quantity.");
    return { slug, name: product.name, qty, unitPaise: product.price * 100 };
  });

  const totalPaise = items.reduce((sum, i) => sum + i.unitPaise * i.qty, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);
  return { items, totalPaise, description: `${count} item${count === 1 ? "" : "s"} from Ayushmati` };
}

export type PricedConsultation = {
  practitionerId: string;
  practitionerTitle: string;
  slot: string;
  totalPaise: number;
  description: string;
};

export function priceConsultation(practitionerId: string, slot: string, now = new Date()): PricedConsultation {
  const practitioner = getPractitioner(practitionerId);
  if (!practitioner) throw new PricingError("Unknown practitioner.");
  const open = getOpenSlots(practitioner.id, now, BOOKING_WINDOW_DAYS).some((d) => d.slots.includes(slot));
  if (!open) throw new PricingError("That time is no longer available. Please choose another slot.");
  return {
    practitionerId: practitioner.id,
    practitionerTitle: practitioner.title,
    slot,
    totalPaise: practitioner.fee * 100,
    description: `Video consultation, ${formatSlotDay(slot)} ${formatSlotTime(slot)} IST`,
  };
}
