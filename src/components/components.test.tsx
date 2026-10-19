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

// Minimal stand-in for the YouTube IFrame Player API. Every instance is recorded, since the hero
// stacks two players (on-screen + preloading the next film).
type FakeEvents = {
  onReady: (e: { target: FakePlayer }) => void;
  onStateChange: (e: { target: FakePlayer; data: number }) => void;
  onApiChange: (e: { target: FakePlayer }) => void;
};
class FakePlayer {
  static all: FakePlayer[] = [];
  calls: string[] = [];
  time = 0;
  duration = 0;
  constructor(
    public el: HTMLElement,
    public opts: { videoId: string; playerVars: Record<string, string | number>; events: FakeEvents },
  ) {
    FakePlayer.all.push(this);
  }
  playVideo() { this.calls.push("play"); }
  pauseVideo() { this.calls.push("pause"); }
  seekTo(s: number) { this.calls.push(`seek:${s}`); }
  mute() { this.calls.push("mute"); }
  unMute() { this.calls.push("unMute"); }
  setVolume(v: number) { this.calls.push(`volume:${v}`); }
  getCurrentTime() { return this.time; }
  getDuration() { return this.duration; }
  loadVideoById(o: { videoId: string; startSeconds?: number; endSeconds?: number }) {
    this.calls.push(`load:${o.videoId}@${o.startSeconds ?? 0}-${o.endSeconds ?? "end"}`);
  }
  unloadModule(m: string) { this.calls.push(`unload:${m}`); }
  setOption(m: string, o: string) { this.calls.push(`option:${m}.${o}`); }
  destroy() { this.calls.push("destroy"); }
  // Test helpers: fire the player's events.
  ready() { act(() => this.opts.events.onReady({ target: this })); }
  state(data: number) { act(() => this.opts.events.onStateChange({ target: this, data })); }
}
const STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 };
const FILMS = [
  { id: "film-one", label: "Ancient way of healing", start: 9, end: 64 },
  { id: "film-two", label: "Art of healing", end: 452 },
];

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
    FakePlayer.all = [];
    vi.stubGlobal("YT", { Player: FakePlayer, PlayerState: STATE });
    // Run "when idle" work straight away.
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
      cb();
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", () => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "connection");
    Reflect.deleteProperty(document, "visibilityState");
  });

  function stubReducedMotion(reduce: boolean) {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q }));
  }

  async function renderHero() {
    render(
      <HeroVideo films={FILMS} title="Intro">
        <h1>Headline</h1>
      </HeroVideo>,
    );
    await act(async () => {});
  }

  /** On-screen player ready and playing; returns it and the background player it then creates. */
  function startPlayback() {
    const main = FakePlayer.all[0];
    main.ready();
    main.state(STATE.PLAYING);
    const next = FakePlayer.all[1];
    return { main, next };
  }

  /** Background player finishes preloading (YouTube reports it playing once, then we park it). */
  function preload(next: FakePlayer) {
    next.ready();
    next.state(STATE.PLAYING);
  }

  const button = (name: RegExp) => screen.getByRole("button", { name });

  it("autoplays the first film muted with YouTube chrome and subtitles off", async () => {
    stubReducedMotion(false);
    await renderHero();
    expect(screen.getByRole("heading", { name: "Headline" })).toBeInTheDocument();
    const { main } = startPlayback();
    expect(main.opts.videoId).toBe("film-one");
    expect(main.opts.playerVars).toMatchObject({ autoplay: 1, mute: 1, controls: 0, start: 9, end: 64, playsinline: 1, cc_load_policy: 0 });
    expect(main.calls.filter((c) => c === "mute" || c === "play")).toEqual(["mute", "play"]);
    expect(main.calls).toEqual(expect.arrayContaining(["unload:captions", "unload:cc", "option:captions.track"]));
    expect(button(/sound on/i)).toHaveAttribute("aria-pressed", "false");
  });

  it("preloads the next film in a second, hidden player parked on its first frame", async () => {
    stubReducedMotion(false);
    await renderHero();
    const { next } = startPlayback();
    expect(next).toBeDefined();
    expect(next.opts.videoId).toBe("film-two");
    expect(next.opts.playerVars).toMatchObject({ mute: 1, start: 0, end: 452 });
    preload(next);
    expect(next.calls.slice(-2)).toEqual(["pause", "seek:0"]);
    expect(screen.getByTestId("hero-player-1")).toHaveClass("opacity-0");
  });

  it("hands over to the preloaded film just before the end, with no gap, and keeps looping", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
    stubReducedMotion(false);
    await renderHero();
    const { main, next } = startPlayback();
    preload(next);

    main.time = 30;
    act(() => vi.advanceTimersByTime(400));
    expect(next.calls.at(-1)).toBe("seek:0"); // nothing yet

    main.time = 63.7; // within 0.4 s of film 1's end (64 s)
    act(() => vi.advanceTimersByTime(250));
    expect(next.calls.at(-1)).toBe("play"); // already buffered: starts immediately
    expect(main.calls.at(-1)).toBe("mute");
    expect(screen.getByTestId("hero-player-1")).toHaveClass("opacity-100");
    expect(screen.getByTestId("hero-player-0")).toHaveClass("opacity-0");
    expect(button(/art of healing/i)).toHaveAttribute("aria-pressed", "true");

    // After the cross-fade the old player pauses and preloads the film after this one (film 1 again).
    act(() => vi.advanceTimersByTime(700));
    expect(main.calls.slice(-3)).toEqual(["pause", "mute", "load:film-one@9-64"]);
    main.state(STATE.PLAYING);
    expect(main.calls.slice(-2)).toEqual(["pause", "seek:9"]);

    // Film 2 ends -> back to film 1 in the first player.
    next.time = 451.7;
    act(() => vi.advanceTimersByTime(250));
    expect(main.calls.at(-1)).toBe("play");
    expect(screen.getByTestId("hero-player-0")).toHaveClass("opacity-100");
    expect(button(/ancient way of healing/i)).toHaveAttribute("aria-pressed", "true");
  });

  it("carries sound over to the next film when sound is on", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
    stubReducedMotion(false);
    await renderHero();
    const { main, next } = startPlayback();
    preload(next);
    fireEvent.click(button(/sound on/i));
    expect(main.calls).toContain("unMute");

    main.state(STATE.ENDED); // backstop: the end event alone also triggers the hand-over
    expect(next.calls.slice(-3)).toEqual(["unMute", "volume:100", "play"]);
    expect(main.calls.at(-1)).toBe("mute");
  });

  it("turns sound on with the first interaction, including a phone tap", async () => {
    stubReducedMotion(false);
    await renderHero();
    const { main } = startPlayback();
    fireEvent.touchEnd(screen.getByRole("heading", { name: "Headline" }));
    expect(main.calls).toContain("unMute");
    expect(button(/sound off/i)).toHaveAttribute("aria-pressed", "true");
  });

  it("lets the visitor mute, and then stays muted", async () => {
    stubReducedMotion(false);
    await renderHero();
    const { main } = startPlayback();
    await userEvent.click(button(/sound on/i));
    await userEvent.click(button(/sound off/i));
    expect(main.calls.at(-1)).toBe("mute");
    await userEvent.click(screen.getByRole("heading", { name: "Headline" }));
    expect(main.calls.at(-1)).toBe("mute");
  });

  it("falls back to muted playback if the browser blocks sound", async () => {
    stubReducedMotion(false);
    await renderHero();
    const { main } = startPlayback();
    await userEvent.click(button(/sound on/i));
    main.state(STATE.PAUSED);
    expect(main.calls.slice(-2)).toEqual(["mute", "play"]);
    expect(button(/sound on/i)).toBeInTheDocument();
  });

  it("jumps to a chosen film and re-aims the preloading player at the one after it", async () => {
    stubReducedMotion(false);
    await renderHero();
    const { main, next } = startPlayback();
    preload(next);
    await userEvent.click(button(/art of healing/i));
    expect(main.calls.at(-1)).toBe("load:film-two@0-452");
    expect(next.calls.at(-1)).toBe("load:film-one@9-64");
    expect(button(/art of healing/i)).toHaveAttribute("aria-pressed", "true");
    expect(main.calls).not.toContain("unMute"); // choosing a film doesn't switch sound on by itself
  });

  it("pauses while the tab is hidden without treating it as blocked sound, then resumes", async () => {
    stubReducedMotion(false);
    await renderHero();
    const { main } = startPlayback();
    await userEvent.click(button(/sound on/i));

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(main.calls.at(-1)).toBe("pause");
    main.state(STATE.PAUSED);
    expect(main.calls.at(-1)).toBe("pause"); // not re-muted and restarted
    expect(button(/sound off/i)).toBeInTheDocument();

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(main.calls.at(-1)).toBe("play");
  });

  it("can be paused by the visitor", async () => {
    stubReducedMotion(false);
    await renderHero();
    const { main } = startPlayback();
    await userEvent.click(button(/pause film/i));
    expect(main.calls.at(-1)).toBe("pause");
  });

  it("shows the still image on Data Saver until the visitor presses play", async () => {
    stubReducedMotion(false);
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
    await renderHero();
    expect(FakePlayer.all).toHaveLength(0);
    await userEvent.click(button(/play film/i));
    await act(async () => {});
    expect(FakePlayer.all).toHaveLength(1);
  });

  it("starts the chosen film when reduced motion is preferred and the visitor picks one", async () => {
    stubReducedMotion(true);
    await renderHero();
    expect(FakePlayer.all).toHaveLength(0);
    await userEvent.click(button(/art of healing/i));
    await act(async () => {});
    expect(FakePlayer.all[0].opts.videoId).toBe("film-two");
    expect(FakePlayer.all[0].opts.playerVars.start).toBe(0);
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
