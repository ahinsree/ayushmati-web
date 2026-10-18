# Ayushmati Ayurveda: web platform

The new ayushmati website: a nature-inspired storefront for Ayushmati's in-house Ayurvedic medicines, skincare, hair care and supplements; online consultations with Ayushmati's doctors; and an AI wellness guide that runs a preliminary Ayurvedic consultation and renders product carousels, booking widgets and personalised routines inside the chat.

**Demo:** https://ahinsree.github.io/ayushmati-web/ is a static build on GitHub Pages. Every page works, but the AI guide gives scripted example replies, because Pages has no server to call Claude.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Vercel AI SDK 6 + Claude · PostgreSQL + Prisma · Razorpay · Auth.js · Vitest · GitHub Actions → Vercel. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Status

| Area | State |
| --- | --- |
| Landing page with intro video, SEO (metadata, JSON-LD, sitemap), accessibility | Done |
| Storefront: listing, category filter, product pages, cart | Done (sample catalogue) |
| Razorpay checkout for orders and consultation fees | **Test mode** (orders aren't stored yet; webhook next) |
| AI wellness guide with generative UI (products, booking, routine, urgent care) | Done |
| Consultations: practitioners, calendar and slot picker | Done (sample practitioners; payment in test mode) |
| CI/CD (`deploy.yml`) and AI SDLC team (`ai-sdlc.yml`) | Done |
| Database, accounts, order storage and webhooks, booking confirmations and notifications, assistant hardening | Backlog: [docs/backlog](docs/backlog) |

The products and practitioners are **placeholders**. Replace them with Ayushmati's real SKUs, prices, approved label copy and doctors before launch.

## Run locally

Requires Node 20.9+ (22 recommended).

```bash
cp .env.example .env.local     # add ANTHROPIC_API_KEY to use the assistant
npm install
npm run dev                    # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm test` | Vitest unit and component tests |
| `npm run lint` / `npm run typecheck` | ESLint / route type generation + `tsc` |
| `npm run build` | Production build |
| `npm run db:migrate` | Prisma migrations (once backlog 01 lands) |

## Payments (Razorpay test mode)

1. In the Razorpay Dashboard, switch to **Test Mode** and generate API keys (the key id starts with `rzp_test_`).
2. Put them in `.env.local` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, then restart `npm run dev`.
3. Pay with a test card (`4100 2800 0000 1007`, any future expiry and CVV, any 4–10 digit OTP) or the test UPI ID `success@razorpay` (`failure@razorpay` to see a failure).

The server prices every order itself, creates the Razorpay order, and verifies Checkout's signature before showing a confirmation. On the static GitHub Pages demo there's no server, so payments are simulated and labelled as such.

## Deploy (GitHub → Vercel)

1. Create the GitHub repo and push: `gh repo create <owner>/ayushmati-web --private --source . --push`.
2. Create a Vercel project (`npx vercel link`), then add the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`, plus `DATABASE_URL` once there are migrations.
3. In Vercel, set the runtime env vars from `.env.example` (`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`, ...).
4. `.github/workflows/deploy.yml` then verifies every PR (lint, typecheck, tests, build), posts a preview URL, and deploys `main` to production. Until the secrets exist, it verifies but skips deploys.

### Static demo (GitHub Pages)

`.github/workflows/pages.yml` publishes the demo on every push to `main`. `npm run build:pages` builds it locally into `out/`. The build sets aside the server-only `/api/chat` route, exports static HTML under `/ayushmati-web`, and switches the assistant to the scripted replies in `src/components/chat/demo-replies.ts`.

## Building features with the AI SDLC team

This repo includes the [AI SDLC](https://github.com/ahinsree/ai-sdlc) agent team: Product, Architect, Developer, QA, Reviewer and DevOps, with three human gates.

- **From GitHub:** run `../ai-sdlc/claude-team/install-github.sh .` once after the repo has a remote (it creates labels and allows Actions to open PRs), add an `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` secret, then open an issue (for example, paste one of [docs/backlog](docs/backlog)) and label it `ai-sdlc`. Reply `/approve` on the spec and design; the team opens a PR for you to review.
- **In Claude Code:** `/sdlc <feature request>` runs the same pipeline locally with gates in the terminal.

The team runs `npm test && npm run lint && npm run typecheck` as its objective check. Agent conventions are in [CLAUDE.md](CLAUDE.md).
