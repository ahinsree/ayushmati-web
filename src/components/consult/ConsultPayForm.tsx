"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { TestModeNotice } from "@/components/checkout/TestModeNotice";
import { TextField, issuesToErrors, type FieldErrors } from "@/components/checkout/CustomerFields";
import type { Practitioner } from "@/lib/consultations";
import { formatINR, formatSlotDay, formatSlotTime } from "@/lib/format";
import { PaymentCancelled, confirmationHref, pay } from "@/lib/payments/checkout-client";
import { customerSchema } from "@/lib/payments/schema";

/** Patient details and payment for a chosen consultation slot. */
export function ConsultPayForm({ practitioner, slot }: { practitioner: Practitioner; slot: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string>();

  async function onSubmit(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const customer = customerSchema.safeParse(data);
    setErrors(customer.success ? {} : issuesToErrors(customer.error.issues));
    setMessage(undefined);
    if (!customer.success) return;

    setPaying(true);
    try {
      const result = await pay(
        {
          kind: "consultation",
          practitionerId: practitioner.id,
          slot,
          customer: customer.data,
          concern: data.concern || undefined,
        },
        practitioner.fee * 100,
        `${practitioner.title}: Video consultation, ${formatSlotDay(slot)} ${formatSlotTime(slot)} IST`,
      );
      router.push(confirmationHref(result));
    } catch (e) {
      setPaying(false);
      setMessage(e instanceof PaymentCancelled ? "Payment cancelled. Your slot hasn't been booked." : (e as Error).message);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(e.currentTarget);
      }}
      className="mt-4 space-y-3"
    >
      <TextField name="name" label="Patient name" errors={errors} autoComplete="name" />
      <TextField name="email" label="Email" type="email" errors={errors} autoComplete="email" inputMode="email" />
      <TextField name="phone" label="Mobile number" type="tel" errors={errors} autoComplete="tel" inputMode="tel" />
      <div>
        <label htmlFor="field-concern" className="block text-sm font-semibold text-forest-900">
          What would you like to discuss? <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="field-concern"
          name="concern"
          rows={2}
          maxLength={240}
          className="mt-1.5 w-full rounded-2xl bg-cream px-4 py-2.5 ring-1 ring-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-500"
        />
      </div>
      <TestModeNotice />
      {message && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={paying}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-forest-700 font-semibold text-white hover:bg-forest-600 disabled:opacity-60"
      >
        {paying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
        {paying ? "Processing…" : `Confirm & pay ${formatINR(practitioner.fee)}`}
      </button>
    </form>
  );
}
