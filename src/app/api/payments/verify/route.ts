import { PaymentsUnavailableError, fetchOrder, getRazorpayConfig, verifyPaymentSignature } from "@/lib/payments/razorpay";
import { verifyRequestSchema, type PaymentConfirmation } from "@/lib/payments/schema";

// Confirms a Checkout payment: checks Razorpay's signature with the key secret, then reads the
// order back from Razorpay so the confirmation shows Razorpay's amount and details, not the browser's.
// TODO(backlog 03): persist orders and handle the payment.captured webhook as the source of truth.
export async function POST(req: Request) {
  let config;
  try {
    config = getRazorpayConfig();
  } catch (e) {
    if (e instanceof PaymentsUnavailableError) return Response.json({ error: e.message }, { status: 503 });
    throw e;
  }

  const parsed = verifyRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;

  if (!verifyPaymentSignature(orderId, paymentId, signature, config.keySecret)) {
    return Response.json({ error: "Payment verification failed." }, { status: 400 });
  }

  try {
    const order = await fetchOrder(config, orderId);
    const body: PaymentConfirmation = {
      orderId,
      paymentId,
      receipt: order.receipt ?? orderId,
      amountPaise: order.amount,
      kind: order.notes.kind === "consultation" ? "consultation" : "cart",
      summary: order.notes.summary ?? "",
      testMode: config.testMode,
    };
    return Response.json(body);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Payment received, but we couldn't load the order details." }, { status: 502 });
  }
}
