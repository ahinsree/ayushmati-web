import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { BookingWidget } from "@/components/chat/BookingWidget";
import { ProductCarousel } from "@/components/chat/ProductCarousel";
import { RichText } from "@/components/chat/RichText";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { getOpenSlots, PRACTITIONERS } from "@/lib/consultations";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-unused-vars
  default: ({ fill, priority, ...props }: Record<string, unknown>) => <img alt="" {...props} />,
}));

describe("YouTubeEmbed", () => {
  it("shows a play button and loads the privacy-friendly player only after a click", async () => {
    render(<YouTubeEmbed id="nwf_jNwNI4s" start={9} title="Intro" />);
    expect(document.querySelector("iframe")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /play video: intro/i }));

    const iframe = screen.getByTitle("Intro");
    expect(iframe.getAttribute("src")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/nwf_jNwNI4s\?/);
    expect(iframe.getAttribute("src")).toContain("start=9");
  });
});

describe("RichText", () => {
  it("renders bullets and bold, and never injects HTML", () => {
    const { container } = render(<RichText text={"**Vata** is high.\n\n- Warm food\n- Early sleep\n\n<img src=x onerror=alert(1)>"} />);
    expect(screen.getByText("Vata").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });
});

function CartCount() {
  const { count, subtotal } = useCart();
  return (
    <p>
      count:{count} subtotal:{subtotal}
    </p>
  );
}

describe("ProductCarousel + cart", () => {
  beforeEach(() => localStorage.clear());

  it("adds a recommended product to the cart and persists it", async () => {
    render(
      <CartProvider>
        <ProductCarousel
          reason="For calm"
          products={[
            { slug: "ashwagandha-capsules", name: "Ashwagandha Capsules", price: 449, size: "60", tagline: "t", category: "supplements" },
          ]}
        />
        <CartCount />
      </CartProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /add ashwagandha capsules to cart/i }));
    expect(screen.getByText("count:1 subtotal:449")).toBeInTheDocument();
    await act(async () => {});
    expect(JSON.parse(localStorage.getItem("ayushmati-cart-v1") ?? "[]")).toEqual([{ slug: "ashwagandha-capsules", qty: 1 }]);
  });

  it("ignores corrupted or unknown items in storage", async () => {
    localStorage.setItem("ayushmati-cart-v1", JSON.stringify([{ slug: "gone", qty: 2 }, { slug: "triphala-churna", qty: 2 }, "junk"]));
    render(
      <CartProvider>
        <CartCount />
      </CartProvider>,
    );
    expect(await screen.findByText("count:2 subtotal:398")).toBeInTheDocument();
  });

  it("shows a fallback when there is nothing to recommend", () => {
    render(<ProductCarousel reason="x" products={[]} />);
    expect(screen.getByText(/consultation with one of our doctors/i)).toBeInTheDocument();
  });
});

describe("BookingWidget", () => {
  it("links to the consult page with the chosen practitioner and slot", async () => {
    const from = new Date("2026-10-20T08:00:00+05:30");
    const practitioners = PRACTITIONERS.slice(0, 2).map((p) => ({ ...p, days: getOpenSlots(p.id, from) }));
    render(<BookingWidget practitioners={practitioners} reason="Let's get you seen" />);

    await userEvent.click(screen.getByRole("button", { name: PRACTITIONERS[1].title }));
    const firstSlot = practitioners[1].days[0].slots[0];
    const timeButtons = screen.getAllByRole("button").filter((b) => /\d:\d\d/.test(b.textContent ?? ""));
    await userEvent.click(timeButtons[0]);

    const link = screen.getByRole("link", { name: /continue with/i });
    expect(link.getAttribute("href")).toBe(
      `/consult?practitioner=${PRACTITIONERS[1].id}&slot=${encodeURIComponent(firstSlot)}#booking`,
    );
  });
});
