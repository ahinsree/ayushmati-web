import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.string().trim().email("Please enter a valid email address.").max(120),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a 10-digit Indian mobile number.")),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(3, "Please enter your address.").max(120),
  city: z.string().trim().min(2, "Please enter your city.").max(60),
  state: z.string().trim().min(2, "Please enter your state.").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Please enter a 6-digit PIN code."),
});

export const createOrderRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("cart"),
    lines: z.array(z.object({ slug: z.string().max(80), qty: z.number().int() })).min(1).max(30),
    customer: customerSchema,
    address: addressSchema,
  }),
  z.object({
    kind: z.literal("consultation"),
    practitionerId: z.string().max(40),
    slot: z.string().max(40),
    customer: customerSchema,
    concern: z.string().trim().max(240).optional(),
  }),
]);

export type CreateOrderRequest = z.input<typeof createOrderRequestSchema>;

export const verifyRequestSchema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: "INR";
  keyId: string;
  description: string;
  testMode: boolean;
  prefill: { name: string; email: string; contact: string };
};

export type PaymentConfirmation = {
  orderId: string;
  paymentId: string;
  receipt: string;
  amountPaise: number;
  kind: "cart" | "consultation";
  summary: string;
  testMode: boolean;
};
