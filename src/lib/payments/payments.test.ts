import { createHmac } from "node:crypto";
import { PRACTITIONERS, getOpenSlots } from "@/lib/consultations";
import { PricingError, priceCart, priceConsultation } from "./pricing";
import { PaymentsUnavailableError, createOrder, getRazorpayConfig, verifyPaymentSignature } from "./razorpay";
import { customerSchema } from "./schema";

const sign = (orderId: string, paymentId: string, secret: string) =>
  createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

describe("priceCart", () => {
  it("prices from the catalogue in paise and merges duplicate lines", () => {
    const cart = priceCart([
      { slug: "triphala-churna", qty: 1 },
      { slug: "triphala-churna", qty: 1 },
      { slug: "chyawanprash", qty: 1 },
    ]);
    expect(cart.totalPaise).toBe((199 * 2 + 399) * 100);
    expect(cart.items).toHaveLength(2);
    expect(cart.description).toBe("3 items from Ayushmati");
  });

  it("rejects empty carts, unknown products and bad quantities", () => {
    expect(() => priceCart([])).toThrow(PricingError);
    expect(() => priceCart([{ slug: "nope", qty: 1 }])).toThrow(PricingError);
    expect(() => priceCart([{ slug: "chyawanprash", qty: 0 }])).toThrow(PricingError);
    expect(() => priceCart([{ slug: "chyawanprash", qty: 11 }])).toThrow(PricingError);
  });
});

describe("priceConsultation", () => {
  const now = new Date("2026-10-20T08:00:00+05:30");
  const p = PRACTITIONERS[0];

  it("charges the practitioner's fee for an open slot", () => {
    const slot = getOpenSlots(p.id, now, 30)[0].slots[0];
    const priced = priceConsultation(p.id, slot, now);
    expect(priced.totalPaise).toBe(p.fee * 100);
    expect(priced.description).toMatch(/Video consultation/);
  });

  it("rejects unknown practitioners and slots that aren't open", () => {
    expect(() => priceConsultation("nobody", "2026-10-21T10:00:00+05:30", now)).toThrow(PricingError);
    expect(() => priceConsultation(p.id, "2026-10-25T10:00:00+05:30", now)).toThrow(/no longer available/); // Sunday
  });
});

const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv;

describe("Razorpay config", () => {
  it("needs both keys", () => {
    expect(() => getRazorpayConfig(env({ RAZORPAY_KEY_ID: "rzp_test_x" }))).toThrow(PaymentsUnavailableError);
  });

  it("accepts test keys and refuses live keys in this test version", () => {
    expect(getRazorpayConfig(env({ RAZORPAY_KEY_ID: "rzp_test_abc", RAZORPAY_KEY_SECRET: "s" })).testMode).toBe(true);
    expect(() => getRazorpayConfig(env({ RAZORPAY_KEY_ID: "rzp_live_abc", RAZORPAY_KEY_SECRET: "s" }))).toThrow(
      /test version/,
    );
    expect(
      getRazorpayConfig(env({ RAZORPAY_KEY_ID: "rzp_live_abc", RAZORPAY_KEY_SECRET: "s", PAYMENTS_ALLOW_LIVE: "1" }))
        .testMode,
    ).toBe(false);
  });
});

describe("verifyPaymentSignature", () => {
  it("accepts Razorpay's signature and rejects tampered ones", () => {
    const sig = sign("order_1", "pay_1", "secret");
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "secret")).toBe(true);
    expect(verifyPaymentSignature("order_2", "pay_1", sig, "secret")).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "other-secret")).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "short", "secret")).toBe(false);
  });
});

describe("createOrder", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts paise, INR and trimmed receipt/notes with Basic auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "order_X", amount: 100 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const config = { keyId: "rzp_test_k", keySecret: "sec", testMode: true };
    await createOrder(config, { amountPaise: 19900, receipt: "R".repeat(60), notes: { a: "x".repeat(300) } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.razorpay.com/v1/orders");
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("rzp_test_k:sec").toString("base64")}`);
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ amount: 19900, currency: "INR" });
    expect(body.receipt).toHaveLength(40);
    expect(body.notes.a).toHaveLength(256);
  });
});

describe("customerSchema", () => {
  it("normalises Indian mobile numbers", () => {
    const ok = customerSchema.parse({ name: "Asha K", email: "a@b.in", phone: "+91 98765-43210" });
    expect(ok.phone).toBe("9876543210");
    expect(customerSchema.safeParse({ name: "Asha", email: "a@b.in", phone: "12345" }).success).toBe(false);
  });
});
