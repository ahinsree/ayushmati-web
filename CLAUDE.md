# ayushmati-web: notes for AI agents

Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS 4 + TypeScript (strict). AI assistant on the Vercel AI SDK 6 with Claude. Read `docs/ARCHITECTURE.md` before designing a change.

## Commands

- `npm test`: Vitest (jsdom). This is the suite the SDLC team and CI run, together with `npm run lint` and `npm run typecheck`.
- `npm run typecheck`: runs `next typegen` (generates `PageProps<...>` route types), then `tsc --noEmit`.
- `npm run build`: production build. `npm run dev`: local server on :3000.

## Conventions

- Tests sit next to the code as `*.test.ts(x)` under `src/` (for example `src/lib/catalog.test.ts`). Name acceptance tests after the criterion: `it("AC1: ...")`.
- Server Components by default; add `"use client"` only for state, effects or browser APIs.
- Route `params` and `searchParams` are Promises in Next 16: `await` them, and type pages with `PageProps<"/route">`.
- Domain logic lives in `src/lib/` as plain functions with no React. UI goes in `src/components/<area>/`.
- Styling uses Tailwind utilities with the brand tokens in `src/app/globals.css` (`forest-*`, `leaf-*`, `cream`, `sand`, `earth`, `turmeric`, `ink`, `muted`). No new colour literals.
- Money is integer INR in the UI layer and integer paise in the database and with Razorpay. Times are stored in UTC and shown in `Asia/Kolkata`.
- Accessibility: every control needs an accessible name, keep visible focus styles, and don't use colour alone to carry meaning.
- Generative UI: each assistant tool lives in `src/lib/ai/tools.ts` and has a matching renderer case in `src/components/chat/Chat.tsx`. Tools return only what the UI needs; never return secrets or other users' data.

## Guardrails

- Never commit secrets. New settings go in `.env.example` with an empty value.
- Payment and booking state changes happen only server-side, after verifying the Razorpay signature or webhook.
- The assistant gives wellness guidance only. Keep the safety rules in `src/lib/ai/system-prompt.ts` intact, and update its tests when you change it.
