"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Leaf, X } from "lucide-react";
import { Chat } from "./Chat";

export function AssistantLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname === "/assistant") return null;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Ayushmati AI wellness guide"
          className="fixed inset-x-2 bottom-20 z-50 flex h-[min(42rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-3xl bg-cream shadow-2xl ring-1 ring-forest-900/10 sm:inset-x-auto sm:right-5 sm:w-[26rem]"
        >
          <div className="flex items-center justify-between bg-forest-800 px-4 py-3 text-white">
            <p className="font-display text-lg">AI Wellness Guide</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close wellness guide"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <Chat variant="panel" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close wellness guide" : "Open AI wellness guide"}
        className="fixed bottom-4 right-4 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-forest-700 px-5 font-semibold text-white shadow-lg transition hover:bg-forest-600 sm:right-5"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Leaf className="h-5 w-5" aria-hidden />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask our Ayurveda guide"}</span>
      </button>
    </>
  );
}
