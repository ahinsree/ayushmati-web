const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const SITE = {
  name: "Ayushmati",
  description:
    "Authentic Ayurveda for modern wellness: in-house Ayurvedic medicines, herbal skincare and hair care, and online consultations with expert doctors.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /**
   * Hero films, played in order and then looped (YouTube IDs, both from Kerala Tourism's channel):
   * "Come to Kerala - Experience the ancient way of healing" and "Ayurveda - Art of Healing"
   * (https://www.keralatourism.org/ayurveda/video-gallery/ayurveda-art/1088).
   */
  // `end` stops each film before its closing on-screen text (film 1: 1:04–1:20 of 1:21;
  // film 2: 7:32–7:45 of 7:45) and moves on to the next film.
  heroFilms: [
    { id: "nwf_jNwNI4s", label: "Ancient way of healing", end: 64 },
    { id: "YK9g9KMVs0M", label: "Art of healing", end: 452 },
  ],
  /** True in the static GitHub Pages demo, where there is no server for the AI assistant. */
  staticDemo: process.env.NEXT_PUBLIC_STATIC_DEMO === "1",
};

// Contact details as published on https://www.ayushmati.org/contact1
export const CONTACT = {
  email: "info@ayushmati.org",
  phone: "+91 94475 60781",
  phoneHref: "tel:+919447560781",
  // Assumes the published phone number is also the WhatsApp Business number; confirm with Ayushmati.
  whatsappHref: "https://wa.me/919447560781",
  address: {
    lines: ["Ayushmati", "Mundakkal, Oorampallil", "Kollam, Kerala 691001"],
    street: "Mundakkal, Oorampallil",
    locality: "Kollam",
    region: "Kerala",
    postalCode: "691001",
  },
  mapsHref: "https://www.google.com/maps/search/?api=1&query=Ayushmati%2C%20Mundakkal%2C%20Oorampallil%2C%20Kollam%20691001",
  hours: [
    { days: "Monday – Friday", time: "9:00 am – 8:00 pm", schema: { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "20:00" } },
    { days: "Saturday – Sunday", time: "10:00 am – 6:00 pm", schema: { dayOfWeek: ["Saturday", "Sunday"], opens: "10:00", closes: "18:00" } },
  ],
};

// TODO(Ayushmati): replace the Instagram and LinkedIn placeholders with the official profiles.
// ayushmati.org itself only links to the platforms' home pages, so the real handles are unknown.
export const SOCIAL_LINKS = [
  { network: "whatsapp", label: "WhatsApp", href: CONTACT.whatsappHref },
  { network: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { network: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/" },
] as const;

export type SocialNetwork = (typeof SOCIAL_LINKS)[number]["network"];

/** Path to a file in /public. next/image doesn't add the basePath to local `src` strings itself. */
export function asset(path: string): string {
  return `${basePath}${path}`;
}
