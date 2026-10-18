// Razorpay Payment Gateway, server side only (uses the key secret).
// Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.razorpay.com/v1";

export type RazorpayConfig = { keyId: string; keySecret: string; testMode: boolean };

export class PaymentsUnavailableError extends Error {}

/**
 * Reads the Razorpay keys. This build is a test version: live keys are refused unless
 * PAYMENTS_ALLOW_LIVE=1 is set deliberately.
 */
export function getRazorpayConfig(env: NodeJS.ProcessEnv = process.env): RazorpayConfig {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new PaymentsUnavailableError("Payments are not configured yet. Add Razorpay test keys to the server settings.");
  }
  const testMode = keyId.startsWith("rzp_test_");
  if (!testMode && env.PAYMENTS_ALLOW_LIVE !== "1") {
    throw new PaymentsUnavailableError("This is a test version: only Razorpay test keys (rzp_test_…) are accepted.");
  }
  return { keyId, keySecret, testMode };
}

function authHeader({ keyId, keySecret }: RazorpayConfig) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  notes: Record<string, string>;
};

async function call<T>(config: RazorpayConfig, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: authHeader(config), "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const description = (body as { error?: { description?: string } }).error?.description;
    throw new Error(`Razorpay ${path} failed (${res.status}): ${description ?? "unknown error"}`);
  }
  return body as T;
}

/** Creates an order. `receipt` must be unique and at most 40 characters; notes are at most 15 pairs of 256 chars. */
export function createOrder(
  config: RazorpayConfig,
  order: { amountPaise: number; receipt: string; notes: Record<string, string> },
): Promise<RazorpayOrder> {
  const notes = Object.fromEntries(
    Object.entries(order.notes)
      .slice(0, 15)
      .map(([k, v]) => [k, v.slice(0, 256)]),
  );
  return call<RazorpayOrder>(config, "/orders", {
    method: "POST",
    body: JSON.stringify({ amount: order.amountPaise, currency: "INR", receipt: order.receipt.slice(0, 40), notes }),
  });
}

export function fetchOrder(config: RazorpayConfig, orderId: string): Promise<RazorpayOrder> {
  return call<RazorpayOrder>(config, `/orders/${encodeURIComponent(orderId)}`);
}

/** Checks Checkout's razorpay_signature: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function newReceipt(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}
