import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutPage from "./page";
import { CartProvider } from "@/components/cart/CartProvider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Checkout page", () => {
  beforeEach(() => localStorage.setItem("ayushmati-cart-v1", JSON.stringify([{ slug: "triphala-churna", qty: 2 }])));
  afterEach(() => localStorage.clear());

  it("shows the order total and test-mode details, and validates before paying", async () => {
    render(
      <CartProvider>
        <CheckoutPage />
      </CartProvider>,
    );
    const pay = await screen.findByRole("button", { name: /pay ₹398 with razorpay/i });
    expect(screen.getByText(/no real money is charged/i)).toBeInTheDocument();
    expect(screen.getByText("success@razorpay")).toBeInTheDocument();

    await userEvent.click(pay);
    expect(screen.getByText("Please enter your full name.")).toBeInTheDocument();
    expect(screen.getByText("Please enter a 6-digit PIN code.")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveAttribute("aria-invalid", "true");
  });
});
