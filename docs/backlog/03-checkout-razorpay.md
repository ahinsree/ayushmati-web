# Checkout with Razorpay

Customers can pay for the items in their cart with Razorpay (UPI, cards, net banking, wallets).

- The cart's Checkout button opens a checkout page that collects contact details and a shipping address (prefilled when signed in).
- The server recalculates the total from database prices (never from client amounts), creates an `Order` (PENDING_PAYMENT) and a Razorpay order, and returns the Razorpay order id.
- Razorpay Checkout opens in the browser. On success, the server verifies the payment signature (HMAC-SHA256 with `RAZORPAY_KEY_SECRET`) before marking the order PAID.
- `/api/webhooks/razorpay` verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET` and idempotently updates `Payment` and `Order` (handles `payment.captured` and `payment.failed`).
- An order confirmation page and email (Resend) show the order number, items and total, and the cart is cleared.
- Failure and cancel paths return to the cart with a clear message, and the order stays PENDING_PAYMENT.
