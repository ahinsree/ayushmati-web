// Sample catalogue used until products move to PostgreSQL (see docs/ARCHITECTURE.md).
// Replace names, prices and label copy with Ayushmati's real SKUs and approved claims
// before going live.

export const CATEGORIES = {
  "ayurvedic-medicine": { label: "Ayurvedic Medicines", blurb: "Classical formulations prepared in-house." },
  skincare: { label: "Herbal Skincare", blurb: "Oils, cleansers and packs for every prakriti." },
  haircare: { label: "Hair Care", blurb: "Traditional oils and gentle herbal cleansers." },
  supplements: { label: "Supplements", blurb: "Daily rasayanas for strength and vitality." },
} as const;

export type Category = keyof typeof CATEGORIES;
export type Dosha = "vata" | "pitta" | "kapha";

export const CONCERNS = [
  "stress",
  "sleep",
  "energy",
  "focus",
  "immunity",
  "digestion",
  "acidity",
  "joint-comfort",
  "acne",
  "skin-glow",
  "pigmentation",
  "hair-fall",
  "dandruff",
] as const;

export type Concern = (typeof CONCERNS)[number];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  price: number; // INR, inclusive of GST
  size: string;
  tagline: string;
  description: string;
  concerns: Concern[];
  doshas: Dosha[];
  ingredients: string[];
  usage: string;
  featured?: boolean;
};

export const PRODUCTS: Product[] = [
  {
    slug: "ashwagandha-capsules",
    name: "Ashwagandha Capsules",
    category: "supplements",
    price: 449,
    size: "60 capsules",
    tagline: "A calming rasayana for stress and restful sleep.",
    description:
      "Standardised Ashwagandha root extract, traditionally used in Ayurveda to support the body's response to stress, steady energy and restful sleep.",
    concerns: ["stress", "sleep", "energy"],
    doshas: ["vata", "kapha"],
    ingredients: ["Ashwagandha (Withania somnifera) root extract"],
    usage: "1 capsule twice daily after meals with warm milk or water, or as directed by your physician.",
    featured: true,
  },
  {
    slug: "triphala-churna",
    name: "Triphala Churna",
    category: "ayurvedic-medicine",
    price: 199,
    size: "100 g",
    tagline: "The classical three-fruit blend for gentle digestion.",
    description:
      "Equal parts Amalaki, Bibhitaki and Haritaki, used for centuries to support regular digestion and gentle detoxification.",
    concerns: ["digestion"],
    doshas: ["vata", "pitta", "kapha"],
    ingredients: ["Amalaki", "Bibhitaki", "Haritaki"],
    usage: "½–1 teaspoon with warm water at bedtime, or as directed by your physician.",
    featured: true,
  },
  {
    slug: "chyawanprash",
    name: "Chyawanprash",
    category: "supplements",
    price: 399,
    size: "500 g",
    tagline: "An Amla-rich jam for everyday immunity.",
    description:
      "A time-honoured blend of Amla and over thirty herbs slow-cooked in ghee and honey, traditionally taken to build strength and immunity.",
    concerns: ["immunity", "energy"],
    doshas: ["vata", "pitta", "kapha"],
    ingredients: ["Amla", "Ashwagandha", "Pippali", "Ghee", "Honey"],
    usage: "1–2 teaspoons daily, followed by warm milk.",
  },
  {
    slug: "brahmi-vati",
    name: "Brahmi Vati",
    category: "ayurvedic-medicine",
    price: 279,
    size: "60 tablets",
    tagline: "Classical support for focus and a calm mind.",
    description:
      "Brahmi and Shankhpushpi tablets, traditionally used to support memory, concentration and mental calm.",
    concerns: ["focus", "stress", "sleep"],
    doshas: ["vata", "pitta"],
    ingredients: ["Brahmi (Bacopa monnieri)", "Shankhpushpi"],
    usage: "1 tablet twice daily after meals, or as directed by your physician.",
  },
  {
    slug: "avipattikar-churna",
    name: "Avipattikar Churna",
    category: "ayurvedic-medicine",
    price: 189,
    size: "100 g",
    tagline: "A cooling formulation for acidity and heartburn.",
    description:
      "A classical pitta-pacifying powder traditionally used to soothe acidity and support comfortable digestion.",
    concerns: ["acidity", "digestion"],
    doshas: ["pitta"],
    ingredients: ["Trikatu", "Triphala", "Lavang", "Trivrit", "Mishri"],
    usage: "½ teaspoon with water before meals, or as directed by your physician.",
  },
  {
    slug: "dhanwantharam-thailam",
    name: "Dhanwantharam Thailam",
    category: "ayurvedic-medicine",
    price: 349,
    size: "200 ml",
    tagline: "A warm Kerala massage oil for joints and muscles.",
    description:
      "A classical vata-balancing oil used in Abhyanga to ease stiffness and support joint comfort.",
    concerns: ["joint-comfort"],
    doshas: ["vata"],
    ingredients: ["Bala", "Dashamoola", "Sesame oil", "Cow's milk"],
    usage: "Warm slightly and massage gently. For external use only.",
  },
  {
    slug: "kumkumadi-tailam",
    name: "Kumkumadi Tailam",
    category: "skincare",
    price: 899,
    size: "15 ml",
    tagline: "The saffron face oil for a natural glow.",
    description:
      "A luxurious saffron-infused facial oil, traditionally used to brighten the complexion and even out skin tone.",
    concerns: ["skin-glow", "pigmentation"],
    doshas: ["vata", "pitta"],
    ingredients: ["Saffron (Kumkuma)", "Manjistha", "Sandalwood", "Sesame oil"],
    usage: "Massage 2–3 drops onto cleansed skin at night.",
    featured: true,
  },
  {
    slug: "neem-turmeric-face-wash",
    name: "Neem & Turmeric Face Wash",
    category: "skincare",
    price: 249,
    size: "100 ml",
    tagline: "A gentle, clarifying cleanser for oily, acne-prone skin.",
    description:
      "Neem, turmeric and tulsi in a soap-free base that cleanses excess oil without stripping the skin.",
    concerns: ["acne"],
    doshas: ["pitta", "kapha"],
    ingredients: ["Neem", "Turmeric", "Tulsi", "Aloe vera"],
    usage: "Use morning and night on damp skin, then rinse.",
  },
  {
    slug: "neelibhringadi-hair-oil",
    name: "Neelibhringadi Hair Oil",
    category: "haircare",
    price: 329,
    size: "200 ml",
    tagline: "A cooling Kerala hair oil for strong, dark hair.",
    description:
      "A classical oil with Neeli, Bhringraj and Amla in coconut oil, traditionally used to reduce hair fall and promote restful sleep.",
    concerns: ["hair-fall", "sleep"],
    doshas: ["pitta"],
    ingredients: ["Neeli (Indigofera)", "Bhringraj", "Amla", "Coconut oil"],
    usage: "Massage into the scalp an hour before washing, 2–3 times a week.",
    featured: true,
  },
  {
    slug: "hibiscus-amla-shampoo",
    name: "Hibiscus & Amla Herbal Shampoo",
    category: "haircare",
    price: 299,
    size: "200 ml",
    tagline: "A mild cleanser that respects the scalp.",
    description:
      "Hibiscus, Amla and Shikakai in a sulphate-free base to cleanse gently and help keep dandruff in check.",
    concerns: ["dandruff", "hair-fall"],
    doshas: ["vata", "pitta", "kapha"],
    ingredients: ["Hibiscus", "Amla", "Shikakai", "Reetha"],
    usage: "Lather on wet hair, massage for a minute and rinse.",
  },
  {
    slug: "giloy-tulsi-tablets",
    name: "Giloy Tulsi Tablets",
    category: "supplements",
    price: 249,
    size: "60 tablets",
    tagline: "Seasonal immunity support.",
    description: "Giloy and Tulsi, traditionally used to support natural immunity through changing seasons.",
    concerns: ["immunity"],
    doshas: ["kapha", "pitta"],
    ingredients: ["Giloy (Tinospora cordifolia)", "Tulsi"],
    usage: "1 tablet twice daily after meals.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category?: Category): Product[] {
  return category ? PRODUCTS.filter((p) => p.category === category) : PRODUCTS;
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured);
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && Object.hasOwn(CATEGORIES, value);
}

/**
 * Rank products for a set of concerns, optionally narrowed by category and dosha.
 * A product must match at least one concern; dosha matches break ties.
 */
export function recommendProducts(opts: {
  concerns: Concern[];
  category?: Category;
  dosha?: Dosha;
  limit?: number;
}): Product[] {
  const { concerns, category, dosha, limit = 4 } = opts;
  return PRODUCTS.filter((p) => !category || p.category === category)
    .map((p) => ({
      p,
      score:
        p.concerns.filter((c) => concerns.includes(c)).length * 10 + (dosha && p.doshas.includes(dosha) ? 1 : 0),
    }))
    .filter(({ score }) => score >= 10)
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price)
    .slice(0, limit)
    .map(({ p }) => p);
}
