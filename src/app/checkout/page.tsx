"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { TestModeNotice } from "@/components/checkout/TestModeNotice";
import { TextField, issuesToErrors, type FieldErrors } from "@/components/checkout/CustomerFields";
import { getProduct } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { PaymentCancelled, confirmationHref, pay } from "@/lib/payments/checkout-client";
import { addressSchema, customerSchema } from "@/lib/payments/schema";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, ready, subtotal, count, clear } = useCart();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "paying">("idle");
  const [message, setMessage] = useState<string>();

  if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (count === 0 && status === "idle") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-forest-900">Your cart is empty</h1>
        <Link href="/shop" className="mt-4 inline-block font-semibold text-forest-700 underline">
          Browse remedies
        </Link>
      </div>
    );
  }

  async function onSubmit(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const customer = customerSchema.safeParse(data);
    const address = addressSchema.safeParse(data);
    const fieldErrors = {
      ...(customer.success ? {} : issuesToErrors(customer.error.issues)),
      ...(address.success ? {} : issuesToErrors(address.error.issues)),
    };
    setErrors(fieldErrors);
    setMessage(undefined);
    if (!customer.success || !address.success) return;

    setStatus("paying");
    try {
      const result = await pay(
        { kind: "cart", lines, customer: customer.data, address: address.data },
        subtotal * 100,
        `${count} item${count === 1 ? "" : "s"} from Ayushmati`,
      );
      clear();
      router.push(confirmationHref(result));
    } catch (e) {
      setStatus("idle");
      setMessage(e instanceof PaymentCancelled ? "Payment cancelled. Your cart is still here." : (e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-4xl text-forest-900">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(e.currentTarget);
          }}
          className="space-y-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5 sm:p-8"
        >
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 font-display text-2xl text-forest-900">Contact</legend>
            <TextField name="name" label="Full name" errors={errors} autoComplete="name" className="sm:col-span-2" />
            <TextField name="email" label="Email" type="email" errors={errors} autoComplete="email" inputMode="email" />
            <TextField name="phone" label="Mobile number" type="tel" errors={errors} autoComplete="tel" inputMode="tel" />
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 font-display text-2xl text-forest-900">Delivery address</legend>
            <TextField name="line1" label="House, street and area" errors={errors} autoComplete="street-address" className="sm:col-span-2" />
            <TextField name="city" label="City" errors={errors} autoComplete="address-level2" />
            <TextField name="state" label="State" errors={errors} autoComplete="address-level1" />
            <TextField name="pincode" label="PIN code" errors={errors} autoComplete="postal-code" inputMode="numeric" />
          </fieldset>

          <TestModeNotice />

          {message && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "paying"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest-700 font-semibold text-white hover:bg-forest-600 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {status === "paying" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
            {status === "paying" ? "Processing…" : `Pay ${formatINR(subtotal)} with Razorpay`}
          </button>
        </form>

        <aside aria-label="Order summary" className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5">
          <h2 className="font-display text-2xl text-forest-900">Order summary</h2>
          <ul className="mt-4 divide-y divide-forest-900/10">
            {lines.map(({ slug, qty }) => {
              const p = getProduct(slug);
              if (!p) return null;
              return (
                <li key={slug} className="flex justify-between gap-3 py-3 text-sm">
                  <span>
                    {p.name} <span className="text-muted">× {qty}</span>
                  </span>
                  <span className="font-semibold">{formatINR(p.price * qty)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex justify-between border-t border-forest-900/10 pt-4 text-lg">
            <span>Total</span>
            <span className="font-bold text-forest-900">{formatINR(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of GST. Shipping isn&apos;t charged in this test version.</p>
        </aside>
      </div>
    </div>
  );
}
