const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const SITE = {
  name: "Ayushmati Ayurveda",
  description:
    "Authentic Ayurveda for modern wellness: in-house Ayurvedic medicines, herbal skincare and hair care, and online consultations with expert doctors.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  introVideoId: "nwf_jNwNI4s",
  introVideoStart: 0, // play the whole film, then loop from the beginning
  /** True in the static GitHub Pages demo, where there is no server for the AI assistant. */
  staticDemo: process.env.NEXT_PUBLIC_STATIC_DEMO === "1",
};

/** Path to a file in /public. next/image doesn't add the basePath to local `src` strings itself. */
export function asset(path: string): string {
  return `${basePath}${path}`;
}
