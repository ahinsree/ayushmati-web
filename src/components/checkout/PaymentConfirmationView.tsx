"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { formatINR } from "@/lib/format";

export function PaymentConfirmationView() {
  const q = useSearchParams();
  const receipt = q.get("receipt");
  const amount = Number(q.get("amount"));
  const consultation = q.get("kind") === "consultation";
  const demo = q.get("demo") === "1";
  const test = q.get("test") === "1";

  if (!receipt || !Number.isFinite(amount)) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl text-forest-900">No payment to show</h1>
        <Link href="/shop" className="mt-4 inline-block font-semibold text-forest-700 underline">
          Go to the shop
        </Link>
      </div>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-forest-900/5">
      <CheckCircle2 className="mx-auto h-14 w-14 text-leaf-500" aria-hidden />
      <h1 className="mt-4 font-display text-3xl text-forest-900">
        {consultation ? "Your consultation is booked" : "Thank you for your order"}
      </h1>
      <p className="mt-2 text-muted">{q.get("summary")}</p>

      <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
        <Row label="Reference" value={receipt} />
        <Row label="Payment ID" value={q.get("payment") ?? "—"} />
        <Row label="Amount paid" value={formatINR(amount / 100)} />
      </dl>

      {(test || demo) && (
        <p className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-2xl bg-turmeric/10 p-3 text-left text-sm text-earth ring-1 ring-turmeric/40">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {demo
            ? "Demo: this payment was simulated. No money was taken and nothing will be shipped or booked."
            : "Razorpay test mode: no real money was charged and nothing will be shipped or booked."}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="rounded-full bg-forest-700 px-6 py-3 font-semibold text-white hover:bg-forest-600">
          Continue shopping
        </Link>
        <Link href="/" className="rounded-full px-6 py-3 font-semibold text-forest-800 ring-1 ring-forest-700/30 hover:bg-leaf-100">
          Home
        </Link>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-forest-900/10 pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="break-all font-semibold text-forest-900">{value}</dd>
    </div>
  );
}
