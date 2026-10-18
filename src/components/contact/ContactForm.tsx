"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { CONTACT } from "@/lib/site";

export type ContactFields = { name: string; email: string; mobile: string; message: string };

/** mailto: link that opens the visitor's email app with the enquiry filled in. */
export function enquiryMailto({ name, email, mobile, message }: ContactFields): string {
  const subject = `Website enquiry from ${name}`;
  const body = `${message}\n\n—\nName: ${name}\nEmail: ${email}\nMobile: ${mobile}`;
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Until the site has a backend for enquiries, the form hands the message to the visitor's own
// email app, addressed to Ayushmati. Nothing is stored or sent by the website itself.
export function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const fields = Object.fromEntries(
          ["name", "email", "mobile", "message"].map((k) => [k, String(data.get(k) ?? "").trim()]),
        ) as ContactFields;
        window.location.href = enquiryMailto(fields);
        setSent(true);
      }}
      className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5 sm:p-8"
    >
      <h2 className="font-display text-2xl text-forest-900">Send us a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" autoComplete="name" />
        <Field label="Your email" name="email" type="email" autoComplete="email" />
      </div>
      <Field label="Mobile number" name="mobile" type="tel" autoComplete="tel" pattern="[0-9+\s\-]{7,15}" />
      <div>
        <label htmlFor="contact-message" className="block text-sm font-semibold text-forest-900">
          Message <span className="text-red-700" aria-hidden>*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          className="mt-1.5 w-full rounded-2xl bg-cream px-4 py-3 ring-1 ring-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-500"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center gap-2 rounded-full bg-forest-700 px-6 font-semibold text-white hover:bg-forest-600"
      >
        <Send className="h-4 w-4" aria-hidden /> Submit
      </button>
      <p className="text-xs text-muted" aria-live="polite">
        {sent
          ? `Your email app should have opened with your message to ${CONTACT.email}. Please press send there.`
          : `Submitting opens your email app with a message addressed to ${CONTACT.email}.`}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  pattern,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  pattern?: string;
}) {
  const id = `contact-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-forest-900">
        {label} <span className="text-red-700" aria-hidden>*</span>
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        pattern={pattern}
        className="mt-1.5 h-12 w-full rounded-2xl bg-cream px-4 ring-1 ring-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-500"
      />
    </div>
  );
}
