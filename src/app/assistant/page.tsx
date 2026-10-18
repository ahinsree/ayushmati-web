import type { Metadata } from "next";
import { Chat } from "@/components/chat/Chat";

export const metadata: Metadata = {
  title: "AI Wellness Guide",
  description:
    "Chat with Ayushmati's AI Ayurveda guide for a preliminary wellness consultation, personalised remedies and routines, and doctor bookings.",
  alternates: { canonical: "/assistant" },
};

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="font-display text-3xl text-forest-900 sm:text-4xl">AI Wellness Guide</h1>
      <p className="mt-2 text-muted">A preliminary Ayurvedic consultation. For a diagnosis, book one of our doctors.</p>
      <div className="mt-6 overflow-hidden rounded-3xl bg-cream shadow-sm ring-1 ring-forest-900/10">
        <Chat />
      </div>
    </div>
  );
}
