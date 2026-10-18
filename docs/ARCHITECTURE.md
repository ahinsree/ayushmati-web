# Architecture

## Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, React 19, Turbopack) | Server Components for fast, SEO-friendly pages; API routes and server actions keep payments and AI keys on the server; first-class Vercel hosting. |
| Styling | **Tailwind CSS 4**, brand tokens in `globals.css` | Fast iteration with a consistent design system; no runtime CSS. |
| AI assistant | **Vercel AI SDK 6** + `@ai-sdk/anthropic` (Claude Opus 5.5 by default, `AI_MODEL` to change) | `useChat` and typed tool parts let tool calls render as React components (generative UI) while streaming. |
| Database | **PostgreSQL** (Neon or Supabase) + **Prisma 6** | Relational data (orders, payments, appointments) with transactional guarantees; typed client. |
| Auth | **Auth.js** (email OTP + Google), Prisma adapter | Passwordless sign-in suits a consumer health brand; sessions stored in Postgres. |
| Payments | **Razorpay** (UPI, cards, net banking, wallets) | Best coverage for Indian customers; one integration covers both product orders and consultation fees. Stripe can be added later for international customers. |
| Notifications | **Resend** (email) + **MSG91** (SMS/WhatsApp, DLT-compliant) | Transactional confirmations and reminders. |
| Video consults | Google Calendar API with Meet links (or Zoom) | Calendar invites for doctor and patient, with a meeting link per appointment. |
| Testing | **Vitest** + Testing Library (jsdom); Playwright for end-to-end later | Fast unit and component tests that the AI SDLC team can run. |
| CI/CD | **GitHub Actions** → **Vercel** | `deploy.yml`: verify each PR, preview deploys, production on `main`. `ai-sdlc.yml`: builds features from GitHub issues. |

## System overview

```
Browser ──► Next.js on Vercel
            ├─ Server Components: /, /shop, /shop/[slug], /consult          ──► catalogue / practitioners (lib → Prisma)
            ├─ Client islands: cart, booking widget, chat
            ├─ /api/chat  ── streamText(Claude, tools) ──► tools call lib/catalog, lib/consultations
            ├─ /api/checkout (next)   ── Razorpay Orders API
            ├─ /api/webhooks/razorpay (next) ── verify signature → mark Payment/Order/Appointment paid
            └─ server actions (next): bookings, accounts ──► PostgreSQL (Prisma)
                                                         └─► Resend / MSG91 / Google Calendar
```

## How the generative UI works

1. `Chat.tsx` sends the conversation to `/api/chat` via `useChat`.
2. The route calls `streamText` with the system prompt and four tools from `src/lib/ai/tools.ts`:
   - `recommendProducts`: picks from the real catalogue and renders `ProductCarousel` (add to cart inside the chat).
   - `showBookingSlots`: practitioners and live open slots, rendered as `BookingWidget`. Choosing a slot continues to `/consult`.
   - `buildWellnessRoutine`: the model writes a dinacharya, rendered as `RoutineCard`.
   - `flagUrgentCare`: red-flag symptoms, rendered as `UrgentCareNotice` with a call-112 button.
3. Tool calls stream to the browser as typed parts (`tool-<name>` with `input-streaming` → `output-available`). `Chat.tsx` switches on the part type to render the matching component, with loading and error states.
4. Safety is enforced in three places: the system prompt rules, tools that return only catalogue data (the model can't invent products or prices), and a fixed disclaimer in the UI.

## Code map

```
src/
  app/                    routes (page.tsx per route), api/chat, sitemap.ts, robots.ts
  components/
    chat/                 Chat, AssistantLauncher, and the generative UI widgets
    shop/                 ProductCard, ProductVisual, AddToCartButton
    cart/                 CartProvider (client cart in localStorage)
    site/                 Header, Footer
    YouTubeEmbed.tsx      click-to-load, privacy-friendly video embed
  lib/
    catalog.ts            products and recommendation logic (sample data → Prisma)
    consultations.ts      practitioners and slot generation (sample data → Prisma)
    ai/                   system prompt and tools
prisma/schema.prisma      target data model: users, products, orders, payments, practitioners, appointments
```

## Data model (target)

`User` 1─* `Order` 1─* `OrderItem` *─1 `Product`; `Order` 1─* `Payment`.
`Practitioner` 1─* `AvailabilityRule` / `TimeOff` / `Appointment`; `Appointment` 1─1 `Payment`.
`@@unique([practitionerId, startsAt])` on `Appointment` prevents double-booking at the database level.

## Security and compliance

- Secrets live only in Vercel and GitHub environment secrets. The AI key is used only in `/api/chat`.
- Payments: create Razorpay orders server-side, verify `razorpay_signature` (HMAC-SHA256), and treat the webhook as the source of truth. Never trust amounts sent by the client.
- Health data: chat is not stored by default. Any future storage needs explicit consent, encryption at rest and a retention policy, in line with India's DPDP Act 2023. Teleconsultation must follow the Telemedicine Practice Guidelines (registered practitioners, consent, records).
- `/api/chat` caps conversation length. Add per-IP rate limiting before launch (backlog 05).
- Security headers are set in `next.config.ts`; add a CSP once the third-party scripts (Razorpay, analytics) are final.

## Delivery process (AI SDLC)

Every feature after this foundation goes through the AI SDLC team (`.claude/`, `.github/workflows/ai-sdlc.yml`):
issue labelled `ai-sdlc` → spec (Gate 1, `/approve`) → design (Gate 2, `/approve`) → Developer ⇄ QA → Reviewer → PR (Gate 3: human review and merge) → `deploy.yml` deploys.
The feature requests are drafted in `docs/backlog/`.
