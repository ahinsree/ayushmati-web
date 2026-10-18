"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Info, Leaf, Loader2, RotateCcw, Square } from "lucide-react";
import type { AssistantMessage } from "@/lib/ai/tools";
import { SITE } from "@/lib/site";
import { BookingWidget } from "./BookingWidget";
import { demoReply } from "./demo-replies";
import { ProductCarousel } from "./ProductCarousel";
import { RichText } from "./RichText";
import { RoutineCard } from "./RoutineCard";
import { UrgentCareNotice } from "./UrgentCareNotice";

const STARTERS = [
  "I feel stressed and I'm not sleeping well",
  "My skin looks dull and uneven",
  "I've been losing more hair lately",
  "I often get acidity after meals",
  "I'd like to talk to a doctor",
];

type Part = AssistantMessage["parts"][number];
type Variant = "page" | "panel";

function ToolPending({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {label}
    </p>
  );
}

function ToolFailed() {
  return <p className="text-sm text-red-700">Sorry, I couldn&apos;t load that just now.</p>;
}

/** Maps each message part to UI: text becomes prose, tool calls become interactive components. */
function MessagePart({ part }: { part: Part }) {
  switch (part.type) {
    case "text":
      return <RichText text={part.text} />;

    case "tool-recommendProducts":
      if (part.state === "output-available") return <ProductCarousel {...part.output} />;
      if (part.state === "output-error") return <ToolFailed />;
      return <ToolPending label="Choosing remedies for you…" />;

    case "tool-showBookingSlots":
      if (part.state === "output-available") return <BookingWidget {...part.output} />;
      if (part.state === "output-error") return <ToolFailed />;
      return <ToolPending label="Checking our doctors' availability…" />;

    case "tool-buildWellnessRoutine":
      if (part.state === "output-available") return <RoutineCard routine={part.output} />;
      if (part.state === "output-error") return <ToolFailed />;
      return <ToolPending label="Writing your daily routine…" />;

    case "tool-flagUrgentCare":
      if (part.state === "output-available") return <UrgentCareNotice {...part.output} />;
      if (part.state === "output-error") return <ToolFailed />;
      return null;

    default:
      return null;
  }
}

export function Chat({ variant = "page" }: { variant?: Variant }) {
  return SITE.staticDemo ? <DemoChat variant={variant} /> : <LiveChat variant={variant} />;
}

/** The real assistant: Claude via /api/chat. */
function LiveChat({ variant }: { variant: Variant }) {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat<AssistantMessage>();
  return (
    <ChatView
      variant={variant}
      messages={messages}
      thinking={status === "submitted"}
      busy={status === "submitted" || status === "streaming"}
      error={!!error}
      onSend={(text) => sendMessage({ text })}
      onStop={stop}
      onRetry={() => regenerate()}
    />
  );
}

/** Static demo (GitHub Pages): scripted replies that render the same generative UI. */
function DemoChat({ variant }: { variant: Variant }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function send(text: string) {
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", parts: [{ type: "text", text }] }]);
    setThinking(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, demoReply(text)]);
      setThinking(false);
    }, 700);
  }

  return (
    <ChatView
      variant={variant}
      messages={messages}
      thinking={thinking}
      busy={thinking}
      error={false}
      onSend={send}
      onStop={() => {
        clearTimeout(timer.current);
        setThinking(false);
      }}
      onRetry={() => {}}
      notice="Demo mode: replies are scripted examples. The live AI guide runs on the full deployment."
    />
  );
}

function ChatView({
  variant,
  messages,
  thinking,
  busy,
  error,
  onSend,
  onStop,
  onRetry,
  notice,
}: {
  variant: Variant;
  messages: AssistantMessage[];
  thinking: boolean;
  busy: boolean;
  error: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  notice?: string;
}) {
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <div className={`flex min-h-0 flex-col ${variant === "page" ? "h-[calc(100dvh-12rem)] min-h-[32rem]" : "h-full"}`}>
      {notice && (
        <p className="flex items-center gap-2 border-b border-turmeric/30 bg-turmeric/10 px-4 py-2 text-xs text-earth">
          <Info className="h-4 w-4 shrink-0" aria-hidden /> {notice}
        </p>
      )}
      <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-5 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md py-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf-100">
              <Leaf className="h-7 w-7 text-forest-700" aria-hidden />
            </span>
            <p className="mt-4 font-display text-2xl text-forest-900">Namaste. How are you feeling today?</p>
            <p className="mt-2 text-sm text-muted">
              Tell me what&apos;s bothering you. I&apos;ll ask a few questions, share an Ayurvedic view, and suggest remedies,
              a routine or a doctor.
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full bg-white px-3.5 py-2 text-sm text-forest-800 shadow-sm ring-1 ring-forest-900/10 hover:bg-leaf-100"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-forest-700 px-4 py-2.5 text-white">
                {m.parts.map((p, i) => (p.type === "text" ? <p key={i} className="whitespace-pre-wrap">{p.text}</p> : null))}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-3">
              <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-leaf-100" aria-hidden>
                <Leaf className="h-4 w-4 text-forest-700" />
              </span>
              <div className="min-w-0 flex-1 space-y-3 text-ink">
                <span className="sr-only">Ayushmati guide:</span>
                {m.parts.map((part, i) => (
                  <MessagePart key={i} part={part} />
                ))}
              </div>
            </div>
          ),
        )}

        {thinking && <ToolPending label="Thinking…" />}

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            <span className="flex-1">Something went wrong. Please try again.</span>
            <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 font-semibold underline">
              <RotateCcw className="h-4 w-4" aria-hidden /> Retry
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-forest-900/10 bg-white p-3"
      >
        <div className="flex items-end gap-2">
          <label htmlFor={`chat-input-${variant}`} className="sr-only">
            Describe how you are feeling
          </label>
          <textarea
            id={`chat-input-${variant}`}
            rows={1}
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Describe how you're feeling…"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-cream px-4 py-2.5 text-[15px] ring-1 ring-forest-900/10 focus:outline-none focus:ring-2 focus:ring-leaf-500"
          />
          {busy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest-900 text-white"
            >
              <Square className="h-4 w-4 fill-current" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest-700 text-white transition hover:bg-forest-600 disabled:opacity-40"
            >
              <ArrowUp className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          AI guidance for general wellness, not a medical diagnosis. In an emergency, call 112.
        </p>
      </form>
    </div>
  );
}
