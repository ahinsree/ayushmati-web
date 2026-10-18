import { PricingError, priceCart, priceConsultation } from "@/lib/payments/pricing";
import { PaymentsUnavailableError, createOrder, getRazorpayConfig, newReceipt } from "@/lib/payments/razorpay";
import { createOrderRequestSchema, type CreateOrderResponse } from "@/lib/payments/schema";

// Creates a Razorpay order for a cart or a consultation. The amount is always calculated here
// from the catalogue and practitioner fees; the browser only says what is being bought.
export async function POST(req: Request) {
  let config;
  try {
    config = getRazorpayConfig();
  } catch (e) {
    if (e instanceof PaymentsUnavailableError) return Response.json({ error: e.message }, { status: 503 });
    throw e;
  }

  const parsed = createOrderRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const request = parsed.data;
  const { customer } = request;

  let amountPaise: number;
  let description: string;
  let notes: Record<string, string>;
  try {
    if (request.kind === "cart") {
      const cart = priceCart(request.lines);
      const { line1, city, state, pincode } = request.address;
      amountPaise = cart.totalPaise;
      description = cart.description;
      notes = {
        kind: "cart",
        summary: description,
        items: cart.items.map((i) => `${i.slug} x${i.qty}`).join(", "),
        customer: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: `${line1}, ${city}, ${state} ${pincode}`,
      };
    } else {
      const consult = priceConsultation(request.practitionerId, request.slot);
      amountPaise = consult.totalPaise;
      description = consult.description;
      notes = {
        kind: "consultation",
        summary: `${consult.practitionerTitle}: ${consult.description}`,
        practitioner: consult.practitionerId,
        slot: consult.slot,
        customer: customer.name,
        email: customer.email,
        phone: customer.phone,
        ...(request.concern ? { concern: request.concern } : {}),
      };
    }
  } catch (e) {
    if (e instanceof PricingError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }

  try {
    const order = await createOrder(config, {
      amountPaise,
      receipt: newReceipt(request.kind === "cart" ? "AYU" : "AYC"),
      notes,
    });
    const body: CreateOrderResponse = {
      orderId: order.id,
      amount: order.amount,
      currency: "INR",
      keyId: config.keyId,
      description,
      testMode: config.testMode,
      prefill: { name: customer.name, email: customer.email, contact: `+91${customer.phone}` },
    };
    return Response.json(body);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
  }
}
