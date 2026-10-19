import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { BookingWidget } from "@/components/chat/BookingWidget";
import { ProductCarousel } from "@/components/chat/ProductCarousel";
import { RichText } from "@/components/chat/RichText";
import { HeroVideo, coverBox } from "@/components/HeroVideo";
import { getOpenSlots, PRACTITIONERS } from "@/lib/consultations";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-unused-vars
  default: ({ fill, priority, ...props }: Record<string, unknown>) => <img alt="" {...props} />,
}));

// Minimal stand-in for the YouTube IFrame Player API.
class FakePlayer {
  static last: FakePlayer | undefined;
  calls: string[] = [];
  constructor(
    public el: HTMLElement,
    public opts: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (e: { target: FakePlayer }) => void;
        onStateChange: (e: { target: FakePlayer; data: number }) => void;
        onApiChange: (e: { target: FakePlayer }) => void;
      };
    },
  ) {
    FakePlayer.last = this;
  }
  playVideo() { this.calls.push("play"); }
  pauseVideo() { this.calls.push("pause"); }
  seekTo(s: number) { this.calls.push(`seek:${s}`); }
  mute() { this.calls.push("mute"); }
  unMute() { this.calls.push("unMute"); }
  setVolume(v: number) { this.calls.push(`volume:${v}`); }
  loadVideoById(o: { videoId: string; startSeconds?: number }) { this.calls.push(`load:${o.videoId}@${o.startSeconds ?? 0}`); }
  unloadModule(m: string) { this.calls.push(`unload:${m}`); }
  setOption(m: string, o: string) { this.calls.push(`option:${m}.${o}`); }
  destroy() { this.calls.push("destroy"); }
}
const STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 };

describe("coverBox", () => {
  it("covers wide and tall containers with a 16:9 box plus overscan", () => {
    const wide = coverBox(1600, 600);
    expect(wide.width).toBeCloseTo(1600 * 1.12);
    expect(wide.height).toBeGreaterThanOrEqual(600);
    const tall = coverBox(400, 800, 0.65);
    expect(tall.height).toBeCloseTo(800 * 1.12);
    expect(tall.width).toBeCloseTo(800 * (16 / 9) * 1.12);
    expect(tall.left).toBeCloseTo((400 - tall.width) * 0.65); // focal point shifts the crop
  });
});

describe("HeroVideo", () => {
  beforeEach(() => {
    FakePlayer.last = undefined;
    vi.stubGlobal("YT", { Player: FakePlayer, PlayerState: STATE });
    // Run "when idle" work straight away.
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
      cb();
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", () => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "connection");
    Reflect.deleteProperty(document, "visibilityState");
  });

  function stubReducedMotion(reduce: boolean) {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q }));
  }

  async function renderHero() {
    render(
      <HeroVideo ids={["film-one", "film-two"]} start={9} title="Intro">
        <h1>Headline</h1>
      </HeroVideo>,
    );
    await act(async () => {});
  }

  function ready() {
    const p = FakePlayer.last!;
    act(() => p.opts.events.onReady({ target: p }));
    act(() => p.opts.events.onStateChange({ target: p, data: STATE.PLAYING }));
    return p;
  }

  it("autoplays the film muted from the intro point with YouTube chrome hidden", async () => {
    stubReducedMotion(false);
    await renderHero();
    expect(screen.getByRole("heading", { name: "Headline" })).toBeInTheDocument();
    const p = ready();
    expect(p.opts.videoId).toBe("film-one");
    expect(p.opts.playerVars).toMatchObject({ autoplay: 1, mute: 1, controls: 0, start: 9, playsinline: 1, cc_load_policy: 0 });
    expect(p.calls.filter((c) => c === "mute" || c === "play")).toEqual(["mute", "play"]);
    expect(screen.getByRole("button", { name: /sound on/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("turns sound on with the visitor's first interaction anywhere on the page", async () => {
    stubReducedMotion(false);
    await renderHero();
    const p = ready();
    await userEvent.click(screen.getByRole("heading", { name: "Headline" }));
    expect(p.calls).toContain("unMute");
    expect(p.calls).toContain("volume:100");
    expect(screen.getByRole("button", { name: /sound off/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("lets the visitor mute, and then stays muted", async () => {
    stubReducedMotion(false);
    await renderHero();
    const p = ready();
    await userEvent.click(screen.getByRole("button", { name: /sound on/i }));
    expect(p.calls.at(-1)).toBe("volume:100");
    await userEvent.click(screen.getByRole("button", { name: /sound off/i }));
    expect(p.calls.at(-1)).toBe("mute");
    await userEvent.click(screen.getByRole("heading", { name: "Headline" }));
    expect(p.calls.at(-1)).toBe("mute");
  });

  it("falls back to muted playback if the browser blocks sound", async () => {
    stubReducedMotion(false);
    await renderHero();
    const p = ready();
    await userEvent.click(screen.getByRole("button", { name: /sound on/i }));
    act(() => p.opts.events.onStateChange({ target: p, data: STATE.PAUSED }));
    expect(p.calls.slice(-2)).toEqual(["mute", "play"]);
    expect(screen.getByRole("button", { name: /sound on/i })).toBeInTheDocument();
  });

  it("plays the films in order, loops back to the first, and can be paused", async () => {
    stubReducedMotion(false);
    await renderHero();
    const p = ready();
    act(() => p.opts.events.onStateChange({ target: p, data: STATE.ENDED }));
    expect(p.calls.at(-1)).toBe("load:film-two@0");
    act(() => p.opts.events.onStateChange({ target: p, data: STATE.ENDED }));
    expect(p.calls.at(-1)).toBe("load:film-one@9");
    await userEvent.click(screen.getByRole("button", { name: /pause film/i }));
    expect(p.calls.at(-1)).toBe("pause");
  });

  it("keeps YouTube subtitles off", async () => {
    stubReducedMotion(false);
    await renderHero();
    const p = ready();
    expect(p.calls).toEqual(expect.arrayContaining(["unload:captions", "unload:cc", "option:captions.track"]));
    p.calls = [];
    act(() => p.opts.events.onApiChange({ target: p }));
    act(() => p.opts.events.onStateChange({ target: p, data: STATE.PLAYING }));
    expect(p.calls.filter((c) => c === "unload:captions")).toHaveLength(2);
  });

  it("shows the still image on Data Saver or slow connections until the visitor presses play", async () => {
    stubReducedMotion(false);
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
    await renderHero();
    expect(FakePlayer.last).toBeUndefined();
    await userEvent.click(screen.getByRole("button", { name: /play film/i }));
    await act(async () => {});
    expect(FakePlayer.last).toBeDefined();
  });

  it("turns sound on after a tap on a phone (touchend)", async () => {
    stubReducedMotion(false);
    await renderHero();
    const p = ready();
    fireEvent.touchEnd(screen.getByRole("heading", { name: "Headline" }));
    expect(p.calls).toContain("unMute");
  });

  it("pauses while the tab is hidden without treating it as blocked sound, then resumes", async () => {
    stubReducedMotion(false);
    await renderHero();
    const p = ready();
    await userEvent.click(screen.getByRole("button", { name: /sound on/i }));

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(p.calls.at(-1)).toBe("pause");
    act(() => p.opts.events.onStateChange({ target: p, data: STATE.PAUSED }));
    expect(p.calls.at(-1)).toBe("pause"); // not re-muted and restarted
    expect(screen.getByRole("button", { name: /sound off/i })).toBeInTheDocument();

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(p.calls.at(-1)).toBe("play");
  });

  it("waits for the visitor when reduced motion is preferred", async () => {
    stubReducedMotion(true);
    await renderHero();
    expect(FakePlayer.last).toBeUndefined();
    await userEvent.click(screen.getByRole("button", { name: /play film/i }));
    await act(async () => {});
    expect(FakePlayer.last).toBeDefined();
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
