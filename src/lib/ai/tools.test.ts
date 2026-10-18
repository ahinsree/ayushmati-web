import { tools } from "./tools";
import { SYSTEM_PROMPT } from "./system-prompt";

// Calls a tool's execute function the way the AI SDK does.
async function run<T extends keyof typeof tools>(name: T, input: unknown) {
  const execute = tools[name].execute as (input: unknown, options: unknown) => Promise<unknown>;
  return (await execute(input, { toolCallId: "test", messages: [] })) as Record<string, unknown>;
}

describe("assistant tools", () => {
  it("recommendProducts returns real catalogue items with only display fields", async () => {
    const out = await run("recommendProducts", { concerns: ["stress"], reason: "Calming herbs" });
    const products = out.products as Record<string, unknown>[];
    expect(out.reason).toBe("Calming herbs");
    expect(products.length).toBeGreaterThan(0);
    expect(Object.keys(products[0]).sort()).toEqual(["category", "name", "price", "size", "slug", "tagline"]);
  });

  it("showBookingSlots filters by specialty and includes open slots", async () => {
    const out = await run("showBookingSlots", { specialty: "skin-hair", reason: "Persistent acne" });
    const practitioners = out.practitioners as { specialty: string; days: unknown[] }[];
    expect(practitioners).toHaveLength(1);
    expect(practitioners[0].specialty).toBe("skin-hair");
    expect(Array.isArray(practitioners[0].days)).toBe(true);
  });

  it("showBookingSlots without a specialty lists everyone", async () => {
    const out = await run("showBookingSlots", { reason: "Talk to a doctor" });
    expect((out.practitioners as unknown[]).length).toBeGreaterThan(1);
  });

  it("buildWellnessRoutine and flagUrgentCare echo their input for rendering", async () => {
    const routine = { title: "t", dosha: "vata", morning: ["a"], daytime: ["b"], evening: ["c"], favour: [], reduce: [] };
    expect(await run("buildWellnessRoutine", routine)).toEqual(routine);
    expect(await run("flagUrgentCare", { urgency: "emergency", reason: "chest pain" })).toEqual({
      urgency: "emergency",
      reason: "chest pain",
    });
  });
});

describe("system prompt", () => {
  it("names every tool and the core safety rules", () => {
    for (const name of Object.keys(tools)) expect(SYSTEM_PROMPT).toContain(name);
    expect(SYSTEM_PROMPT).toMatch(/not a doctor/i);
    expect(SYSTEM_PROMPT).toMatch(/pregnan/i);
  });
});
