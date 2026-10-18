import { FlaskConical } from "lucide-react";
import { SITE } from "@/lib/site";

// Test details from https://razorpay.com/docs/payments/payments/test-card-details/ and
// https://razorpay.com/docs/payments/payments/test-upi-details/
export function TestModeNotice() {
  return (
    <section aria-label="Test mode" className="rounded-2xl bg-turmeric/10 p-4 text-sm ring-1 ring-turmeric/40">
      <p className="flex items-center gap-2 font-bold text-earth">
        <FlaskConical className="h-4 w-4" aria-hidden /> Test version: no real money is charged
      </p>
      {SITE.staticDemo ? (
        <p className="mt-2 text-ink">
          This demo simulates the payment. On the full site, Razorpay Checkout opens in test mode.
        </p>
      ) : (
        <ul className="mt-2 space-y-1 text-ink">
          <li>
            <strong>Card:</strong> 4100 2800 0000 1007 (Visa), any future expiry, any CVV. On the bank page, any OTP of
            4–10 digits succeeds.
          </li>
          <li>
            <strong>UPI:</strong> <code>success@razorpay</code> to succeed, <code>failure@razorpay</code> to fail.
          </li>
        </ul>
      )}
    </section>
  );
}
