import { AlertTriangle, Phone } from "lucide-react";

export function UrgentCareNotice({ urgency, reason }: { urgency: "emergency" | "soon"; reason: string }) {
  const emergency = urgency === "emergency";
  return (
    <section
      role="alert"
      className={`rounded-2xl p-4 ring-1 ${emergency ? "bg-red-50 ring-red-200" : "bg-amber-50 ring-amber-200"}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${emergency ? "text-red-700" : "text-amber-700"}`} aria-hidden />
        <div className="text-sm">
          <p className={`font-bold ${emergency ? "text-red-900" : "text-amber-900"}`}>
            {emergency ? "Please seek emergency care now" : "Please see a doctor within the next day or two"}
          </p>
          <p className="mt-1 text-ink">{reason}</p>
          {emergency ? (
            <a
              href="tel:112"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800"
            >
              <Phone className="h-4 w-4" aria-hidden /> Call 112
            </a>
          ) : (
            <p className="mt-2 text-muted">
              Ayurvedic care can support your recovery, but this needs a medical examination first.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
