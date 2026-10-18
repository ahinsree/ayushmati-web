"use client";

// Browser side of Razorpay Standard Checkout: create the order on our server, open Checkout,
// then have our server verify the signature. In the static GitHub Pages demo (no server) it
// simulates a test payment instead and says so on the confirmation page.

import { asset, SITE } from "@/lib/site";
import type { CreateOrderRequest, CreateOrderResponse, PaymentConfirmation } from "./schema";

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayFailure = { error: { code: string; description: string; reason?: string } };
type RazorpayInstance = { open(): void; on(event: "payment.failed", cb: (r: RazorpayFailure) => void): void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export class PaymentCancelled extends Error {
  constructor() {
    super("Payment cancelled.");
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Couldn't load Razorpay Checkout. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(asset(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong. Please try again.");
  return data as T;
}

export type PaymentResult = PaymentConfirmation & { demo?: boolean };

export async function pay(request: CreateOrderRequest, demoAmountPaise: number, demoSummary: string): Promise<PaymentResult> {
  if (SITE.staticDemo) {
    await new Promise((r) => setTimeout(r, 900));
    const id = Date.now().toString(36).toUpperCase();
    return {
      demo: true,
      orderId: `order_DEMO${id}`,
      paymentId: `pay_DEMO${id}`,
      receipt: `DEMO-${id}`,
      amountPaise: demoAmountPaise,
      kind: request.kind,
      summary: demoSummary,
      testMode: true,
    };
  }

  const order = await postJson<CreateOrderResponse>("/api/payments/order", request);
  await loadCheckout();
  if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable.");
  const Razorpay = window.Razorpay;

  const success = await new Promise<RazorpaySuccess>((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: SITE.name,
      description: order.description,
      image: `${SITE.url}/logo.png`,
      prefill: order.prefill,
      theme: { color: "#335f20" },
      handler: resolve,
      modal: { ondismiss: () => reject(new PaymentCancelled()), confirm_close: true },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r.error.description || "The payment failed. Please try again.")));
    rzp.open();
  });

  return postJson<PaymentConfirmation>("/api/payments/verify", success);
}

/** URL of the confirmation page for a completed payment. */
export function confirmationHref(result: PaymentResult): string {
  const q = new URLSearchParams({
    receipt: result.receipt,
    payment: result.paymentId,
    amount: String(result.amountPaise),
    kind: result.kind,
    summary: result.summary,
    ...(result.testMode ? { test: "1" } : {}),
    ...(result.demo ? { demo: "1" } : {}),
  });
  return `/checkout/success?${q}`;
}
