# Production-ready AI assistant

Prepare the AI wellness guide for public traffic.

- Per-IP and per-session rate limiting on `/api/chat` (for example 20 messages per 10 minutes) with a friendly message when exceeded.
- An eval set of about 30 scripted conversations (stress and sleep, acne, hair fall, acidity, pregnancy, red-flag chest pain, a child with fever, a request for a prescription dose) with checks that the right tool is called, that red flags always trigger `flagUrgentCare`, and that only catalogue products appear. Run it in CI on changes to `src/lib/ai/`.
- When signed in, the booking widget in the chat can pre-fill the concern note from the conversation, with the user's consent.
- Optional, consent-based saving of chat summaries to the user's account. No storage without consent, with a delete option.
- Observability: log tool calls, latency and token usage (no message content) for cost tracking.
