# Ayushmati Ayurveda: web platform

The new ayushmati website: a nature-inspired storefront for Ayushmati's in-house Ayurvedic medicines, skincare, hair care and supplements; online consultations with Ayushmati's doctors; and an AI wellness guide that runs a preliminary Ayurvedic consultation and renders product carousels, booking widgets and personalised routines inside the chat.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Vercel AI SDK 6 + Claude · PostgreSQL + Prisma · Razorpay · Auth.js · Vitest · GitHub Actions → Vercel. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Status

| Area | State |
| --- | --- |
| Landing page with intro video, SEO (metadata, JSON-LD, sitemap), accessibility | Done |
| Storefront: listing, category filter, product pages, cart | Done (sample catalogue) |
| AI wellness guide with generative UI (products, booking, routine, urgent care) | Done |
| Consultations: practitioners and slot picker | Done (sample practitioners, no payment yet) |
| CI/CD (`deploy.yml`) and AI SDLC team (`ai-sdlc.yml`) | Done |
| Database, accounts, Razorpay checkout, paid bookings and notifications, assistant hardening | Backlog: [docs/backlog](docs/backlog) |

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

## Deploy (GitHub → Vercel)

1. Create the GitHub repo and push: `gh repo create <owner>/ayushmati-web --private --source . --push`.
2. Create a Vercel project (`npx vercel link`), then add the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`, plus `DATABASE_URL` once there are migrations.
3. In Vercel, set the runtime env vars from `.env.example` (`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`, ...).
4. `.github/workflows/deploy.yml` then verifies every PR (lint, typecheck, tests, build), posts a preview URL, and deploys `main` to production. Until the secrets exist, it verifies but skips deploys.

## Building features with the AI SDLC team

This repo includes the [AI SDLC](https://github.com/ahinsree/ai-sdlc) agent team: Product, Architect, Developer, QA, Reviewer and DevOps, with three human gates.

- **From GitHub:** run `../ai-sdlc/claude-team/install-github.sh .` once after the repo has a remote (it creates labels and allows Actions to open PRs), add an `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` secret, then open an issue (for example, paste one of [docs/backlog](docs/backlog)) and label it `ai-sdlc`. Reply `/approve` on the spec and design; the team opens a PR for you to review.
- **In Claude Code:** `/sdlc <feature request>` runs the same pipeline locally with gates in the terminal.

The team runs `npm test && npm run lint && npm run typecheck` as its objective check. Agent conventions are in [CLAUDE.md](CLAUDE.md).
