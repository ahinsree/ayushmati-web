import { createHmac } from "node:crypto";
import { POST as createOrderRoute } from "./order/route";
import { POST as verifyRoute } from "./verify/route";

const post = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const customer = { name: "Asha K", email: "asha@example.com", phone: "9876543210" };
const address = { line1: "12 MG Road", city: "Kollam", state: "Kerala", pincode: "691001" };

describe("payments API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 when Razorpay isn't configured", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");
    expect((await createOrderRoute(post({}))).status).toBe(503);
    expect((await verifyRoute(post({}))).status).toBe(503);
  });

  describe("with test keys", () => {
    beforeEach(() => {
      vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_key");
      vi.stubEnv("RAZORPAY_KEY_SECRET", "test_secret");
    });

    it("creates an order priced on the server, ignoring any amount from the browser", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "order_ABC", amount: 39800, currency: "INR", status: "created", notes: {} })),
      );
      vi.stubGlobal("fetch", fetchMock);
      const res = await createOrderRoute(
        post({ kind: "cart", lines: [{ slug: "triphala-churna", qty: 2 }], customer, address, amount: 1 }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ orderId: "order_ABC", keyId: "rzp_test_key", testMode: true });
      expect(body.prefill.contact).toBe("+919876543210");
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).amount).toBe(39800);
      expect(JSON.stringify(body)).not.toContain("test_secret");
    });

    it("rejects invalid requests and unknown products", async () => {
      expect((await createOrderRoute(post({ kind: "cart", lines: [], customer, address }))).status).toBe(400);
      const res = await createOrderRoute(post({ kind: "cart", lines: [{ slug: "nope", qty: 1 }], customer, address }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/no longer available/);
    });

    it("verifies a genuine payment and returns Razorpay's order details", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({ id: "order_ABC", amount: 39800, receipt: "AYU-1", notes: { kind: "cart", summary: "2 items from Ayushmati" } }),
          ),
        ),
      );
      const signature = createHmac("sha256", "test_secret").update("order_ABC|pay_123").digest("hex");
      const res = await verifyRoute(
        post({ razorpay_order_id: "order_ABC", razorpay_payment_id: "pay_123", razorpay_signature: signature }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ receipt: "AYU-1", amountPaise: 39800, kind: "cart", testMode: true });
    });

    it("rejects a forged signature without calling Razorpay", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const res = await verifyRoute(post({ razorpay_order_id: "order_ABC", razorpay_payment_id: "pay_123", razorpay_signature: "forged" }));
      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
