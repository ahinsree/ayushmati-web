// Scripted replies for the static GitHub Pages demo, where there is no server to call Claude.
// They exercise the same generative UI (product carousel, booking widget, routine card,
// urgent-care notice) with real catalogue and slot data, so the demo shows how the live
// assistant responds.

import type { AssistantMessage } from "@/lib/ai/tools";
import { recommendProducts, type Category, type Concern, type Dosha } from "@/lib/catalog";
import { PRACTITIONERS, getOpenSlots, type Specialty } from "@/lib/consultations";

type Part = AssistantMessage["parts"][number];

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++counter}`;

function text(t: string): Part {
  return { type: "text", text: t, state: "done" };
}

function products(concerns: Concern[], reason: string, dosha?: Dosha, category?: Category): Part {
  const input = { concerns, reason, dosha, category };
  const output = {
    reason,
    products: recommendProducts({ concerns, dosha, category }).map(({ slug, name, price, size, tagline, category }) => ({
      slug,
      name,
      price,
      size,
      tagline,
      category,
    })),
  };
  return { type: "tool-recommendProducts", toolCallId: nextId("call"), state: "output-available", input, output };
}

function booking(reason: string, specialty?: Specialty, now = new Date()): Part {
  const output = {
    reason,
    practitioners: PRACTITIONERS.filter((p) => !specialty || p.specialty === specialty).map((p) => ({
      ...p,
      days: getOpenSlots(p.id, now),
    })),
  };
  return {
    type: "tool-showBookingSlots",
    toolCallId: nextId("call"),
    state: "output-available",
    input: { reason, specialty },
    output,
  };
}

function routine(r: {
  title: string;
  dosha: Dosha;
  morning: string[];
  daytime: string[];
  evening: string[];
  favour: string[];
  reduce: string[];
}): Part {
  return { type: "tool-buildWellnessRoutine", toolCallId: nextId("call"), state: "output-available", input: r, output: r };
}

function urgent(reason: string): Part {
  const v = { urgency: "emergency" as const, reason };
  return { type: "tool-flagUrgentCare", toolCallId: nextId("call"), state: "output-available", input: v, output: v };
}

function reply(parts: Part[]): AssistantMessage {
  return { id: nextId("msg"), role: "assistant", parts };
}

const has = (t: string, re: RegExp) => re.test(t);

export function demoReply(message: string, now = new Date()): AssistantMessage {
  const t = message.toLowerCase();

  if (has(t, /chest pain|can'?t breathe|breathless|faint|numb|suicid|self.?harm|blood in|vomiting blood/)) {
    return reply([
      urgent("You mentioned a symptom that needs a doctor's examination straight away."),
      text("Please get medical help now. Once you're safe, our doctors can support your recovery."),
    ]);
  }

  if (has(t, /pregnan|breastfeed|child|baby|diabet|thyroid|blood pressure|hypertension|medicine|medication/)) {
    return reply([
      text(
        "Thank you for telling me. With pregnancy, children, chronic conditions or regular medicines, it's safest to start with one of our doctors before any remedy.",
      ),
      booking("A physician can tailor herbs and doses safely to your situation.", "general", now),
    ]);
  }

  if (has(t, /doctor|consult|appointment|book|talk to/)) {
    return reply([
      text("Of course. Here are our practitioners and their next open video slots."),
      booking("Pick a time that suits you; consultations are 30 minutes by video.", undefined, now),
    ]);
  }

  if (has(t, /stress|anxi|sleep|insomnia|tired|restless|worr/)) {
    return reply([
      text(
        "Racing thoughts and light, broken sleep often point to **Vata** running high. Warmth, routine and grounding foods help bring it back into balance.",
      ),
      products(["stress", "sleep"], "Calming rasayanas traditionally used for stress and restful sleep.", "vata"),
      routine({
        title: "Calming routine for Vata",
        dosha: "vata",
        morning: ["Wake by 6:30 and sip warm water", "Abhyanga: 10-minute warm sesame oil self-massage", "10 minutes of slow Nadi Shodhana breathing"],
        daytime: ["Eat warm, cooked meals at regular times", "Take short screen breaks every hour"],
        evening: ["Light dinner before 8 pm", "Warm milk with a pinch of nutmeg", "Screens off and lights low by 10 pm"],
        favour: ["Warm soups", "Ghee", "Cooked root vegetables", "Dates"],
        reduce: ["Cold drinks", "Raw salads at night", "Excess caffeine"],
      }),
    ]);
  }

  if (has(t, /acid|heartburn|reflux|burning|indigest|bloat|digest|constipat/)) {
    return reply([
      text(
        "Burning and acidity after meals usually show **Pitta** aggravating digestion (agni). Cooling foods and regular, unhurried meals help most.",
      ),
      products(["acidity", "digestion"], "Classical formulations for comfortable digestion.", "pitta"),
      routine({
        title: "Cooling routine for Pitta",
        dosha: "pitta",
        morning: ["Room-temperature water with a little fennel", "Gentle yoga: Shitali pranayama"],
        daytime: ["Make lunch the main meal", "Eat sitting down, without rushing", "Avoid skipping meals"],
        evening: ["Early, light dinner", "A short walk after dinner", "Fennel or coriander tea"],
        favour: ["Coconut water", "Cucumber", "Rice", "Sweet fruits", "Buttermilk (lunch)"],
        reduce: ["Chillies", "Fried food", "Alcohol", "Coffee on an empty stomach"],
      }),
    ]);
  }

  if (has(t, /hair|dandruff|scalp|bald/)) {
    return reply([
      text("Hair fall is often linked to excess **Pitta** heat in the scalp, plus stress and sleep. A cooling oil and a gentle cleanser are a good start."),
      products(["hair-fall", "dandruff"], "Traditional Kerala hair care for a calm, healthy scalp.", "pitta", "haircare"),
    ]);
  }

  if (has(t, /skin|acne|pimple|glow|dull|pigment|spots|tan/)) {
    const acne = has(t, /acne|pimple|oily/);
    return reply([
      text(
        acne
          ? "Breakouts and oiliness usually reflect **Pitta and Kapha** in the skin. Keep cleansing gentle and favour cooling, light foods."
          : "Dull, uneven skin often responds well to nourishing oils and better sleep. Saffron-based Kumkumadi is a classical choice.",
      ),
      products(acne ? ["acne"] : ["skin-glow", "pigmentation"], "Herbal skincare suited to what you described.", "pitta", "skincare"),
    ]);
  }

  return reply([
    text(
      "Tell me a little more: what's bothering you most, how long has it lasted, and how are your sleep, digestion and energy? You can also try one of the suggestions above.",
    ),
  ]);
}
