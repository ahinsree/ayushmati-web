import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentConfirmationView } from "@/components/checkout/PaymentConfirmationView";

export const metadata: Metadata = {
  title: "Payment confirmed",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-14">
      <Suspense fallback={null}>
        <PaymentConfirmationView />
      </Suspense>
    </div>
  );
}
