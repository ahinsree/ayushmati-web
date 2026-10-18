import { CATEGORIES, CONCERNS, PRODUCTS, getProduct, getProductsByCategory, isCategory, recommendProducts } from "./catalog";

describe("catalog data", () => {
  it("has unique slugs", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses only known categories and concerns, with positive prices", () => {
    for (const p of PRODUCTS) {
      expect(isCategory(p.category)).toBe(true);
      expect(p.concerns.every((c) => (CONCERNS as readonly string[]).includes(c))).toBe(true);
      expect(p.price).toBeGreaterThan(0);
    }
  });

  it("has at least one product in every category", () => {
    for (const c of Object.keys(CATEGORIES)) {
      expect(getProductsByCategory(c as keyof typeof CATEGORIES).length).toBeGreaterThan(0);
    }
  });
});

describe("getProduct / isCategory", () => {
  it("finds products by slug and rejects unknown ones", () => {
    expect(getProduct("triphala-churna")?.name).toBe("Triphala Churna");
    expect(getProduct("nope")).toBeUndefined();
  });

  it("only accepts real category keys", () => {
    expect(isCategory("skincare")).toBe(true);
    expect(isCategory("toString")).toBe(false); // inherited keys must not count
    expect(isCategory("unknown")).toBe(false);
    expect(isCategory(undefined)).toBe(false);
  });
});

describe("recommendProducts", () => {
  it("returns only products that match at least one concern", () => {
    const result = recommendProducts({ concerns: ["acne"] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.concerns.includes("acne"))).toBe(true);
  });

  it("ranks products matching more concerns first", () => {
    const [first] = recommendProducts({ concerns: ["stress", "sleep"] });
    expect(first.concerns).toEqual(expect.arrayContaining(["stress", "sleep"]));
  });

  it("respects category and limit", () => {
    const result = recommendProducts({ concerns: ["sleep", "stress", "hair-fall"], category: "haircare", limit: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("haircare");
  });

  it("uses dosha to break ties", () => {
    const vata = recommendProducts({ concerns: ["digestion", "acidity"], dosha: "pitta" });
    expect(vata[0].doshas).toContain("pitta");
  });

  it("returns nothing when no product matches", () => {
    expect(recommendProducts({ concerns: ["dandruff"], category: "supplements" })).toEqual([]);
  });
});
