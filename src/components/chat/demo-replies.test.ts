import { demoReply } from "./demo-replies";

const NOW = new Date("2026-10-20T08:00:00+05:30");
const types = (text: string) => demoReply(text, NOW).parts.map((p) => p.type);

describe("demo assistant replies", () => {
  it("puts urgent care first for red-flag symptoms, with no products", () => {
    const t = types("I have chest pain since morning");
    expect(t[0]).toBe("tool-flagUrgentCare");
    expect(t).not.toContain("tool-recommendProducts");
  });

  it("sends pregnancy and chronic conditions to a doctor before any product", () => {
    const t = types("I'm pregnant and stressed");
    expect(t).toContain("tool-showBookingSlots");
    expect(t).not.toContain("tool-recommendProducts");
  });

  it("answers stress and sleep with real products and a Vata routine", () => {
    const reply = demoReply("I feel stressed and I'm not sleeping well", NOW);
    const carousel = reply.parts.find((p) => p.type === "tool-recommendProducts");
    expect(carousel?.type === "tool-recommendProducts" && carousel.state === "output-available" && carousel.output.products.length).toBeGreaterThan(0);
    const r = reply.parts.find((p) => p.type === "tool-buildWellnessRoutine");
    expect(r?.type === "tool-buildWellnessRoutine" && r.state === "output-available" && r.output.dosha).toBe("vata");
  });

  it("shows booking slots when asked for a doctor", () => {
    const reply = demoReply("I'd like to talk to a doctor", NOW);
    const b = reply.parts.find((p) => p.type === "tool-showBookingSlots");
    expect(b?.type === "tool-showBookingSlots" && b.state === "output-available" && b.output.practitioners.length).toBeGreaterThan(1);
  });

  it("asks for more detail when it can't tell what's wrong", () => {
    expect(types("hello")).toEqual(["text"]);
  });
});
