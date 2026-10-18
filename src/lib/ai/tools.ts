import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";
import { CATEGORIES, CONCERNS, recommendProducts, type Category } from "@/lib/catalog";
import { PRACTITIONERS, SPECIALTY_LABELS, getOpenSlots, type Specialty } from "@/lib/consultations";

const dosha = z.enum(["vata", "pitta", "kapha"]);

export const tools = {
  recommendProducts: tool({
    description:
      "Show a carousel of Ayushmati products that suit the person's concerns. Use only after you understand the concern.",
    inputSchema: z.object({
      concerns: z.array(z.enum(CONCERNS)).min(1).max(4).describe("Concern tags that best match what the person described"),
      category: z
        .enum(Object.keys(CATEGORIES) as [Category, ...Category[]])
        .optional()
        .describe("Only if the person asked for a specific kind of product"),
      dosha: dosha.optional().describe("The dosha that seems most out of balance, if known"),
      reason: z.string().max(200).describe("One sentence on why these suit the person, shown above the carousel"),
    }),
    execute: async ({ concerns, category, dosha, reason }) => {
      const products = recommendProducts({ concerns, category, dosha });
      return {
        reason,
        products: products.map(({ slug, name, price, size, tagline, category }) => ({
          slug,
          name,
          price,
          size,
          tagline,
          category,
        })),
      };
    },
  }),

  showBookingSlots: tool({
    description:
      "Show an interactive booking widget with Ayushmati practitioners and their open video-consultation slots.",
    inputSchema: z.object({
      specialty: z
        .enum(Object.keys(SPECIALTY_LABELS) as [Specialty, ...Specialty[]])
        .optional()
        .describe("Best-fitting specialty; omit to show all practitioners"),
      reason: z.string().max(200).describe("One sentence on why a consultation is a good next step"),
    }),
    execute: async ({ specialty, reason }) => {
      const practitioners = PRACTITIONERS.filter((p) => !specialty || p.specialty === specialty);
      return {
        reason,
        practitioners: practitioners.map((p) => ({ ...p, days: getOpenSlots(p.id) })),
      };
    },
  }),

  buildWellnessRoutine: tool({
    description:
      "Show a personalised Ayurvedic daily routine card. Fill every section with short, specific, safe suggestions.",
    inputSchema: z.object({
      title: z.string().max(80).describe('e.g. "Calming routine for Vata"'),
      dosha,
      morning: z.array(z.string().max(140)).min(1).max(5),
      daytime: z.array(z.string().max(140)).min(1).max(5),
      evening: z.array(z.string().max(140)).min(1).max(5),
      favour: z.array(z.string().max(60)).max(8).describe("Foods to favour"),
      reduce: z.array(z.string().max(60)).max(8).describe("Foods to reduce"),
    }),
    // The model writes the routine; returning it makes it part of the conversation history.
    execute: async (routine) => routine,
  }),

  flagUrgentCare: tool({
    description: "Show an urgent-care notice when the person describes red-flag symptoms.",
    inputSchema: z.object({
      urgency: z.enum(["emergency", "soon"]).describe('"emergency" for immediate danger, "soon" for see a doctor within 24-48 hours'),
      reason: z.string().max(200).describe("The symptom that triggered this, in plain words"),
    }),
    execute: async ({ urgency, reason }) => ({ urgency, reason }),
  }),
};

export type AssistantTools = InferUITools<typeof tools>;
export type AssistantMessage = UIMessage<never, UIDataTypes, AssistantTools>;
