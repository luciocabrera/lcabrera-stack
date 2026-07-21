# ADR-041: `/ws/runs` authorizes with short-lived subscription tickets

**Status:** Accepted
**Closes:** [STATUS.md §3.3](../STATUS.md) — "`/ws/runs` is unauthenticated", the Phase-2 item ADR-029 §6 deferred ("`/ws/runs` auth (Phase 2)").
**Relates to:** ADR-017 (session + RBAC core), ADR-029 (per-user API tokens), ADR-015 (single orchestrator process).

## Context

`apps/scan-orchestrator` exposes a WebSocket at `/ws/runs`. A client connected,
sent `{ type: 'subscribe', runId }`, and from then on received every status
message for that run. The run id was validated as a uuid and nothing else was
checked — the source said so outright: _"validated as a real uuid, no further
auth (internal tool)"_.

That is a capability check in name only. A uuid is unguessable, not secret: it
appears in the page URL, in loader payloads, in logs, and in any link a user
pastes. Anyone who could reach the port and had seen a run id could watch that
run's scan pipeline in real time. Acceptable while the orchestrator only ever
listened on a developer's laptop; PRD_V2 §2 ends that ("the server is **not**
the developer's machine") and §12 requires auth on every channel.

The constraint that shapes the answer: **the orchestrator has no session.**
Sessions live in `apps/admin_system` — a different process, on a different
origin, holding the signed cookie. The browser will not send that cookie to
`ws://localhost:4100`, and the orchestrator has no way to interpret it if it
did. Nor is a per-user API token (ADR-029) usable here: those are for CLI
clients, and shipping one to a browser tab would hand a long-lived, broadly-
scoped credential to the least trustworthy place we have.

## Decision

**The app that already authorized the user issues a short-lived, run-scoped
ticket, and the orchestrator verifies it statelessly.**

### 1. The primitive — `@lcabrera/server/tickets/`

Two pure functions, no persistence and no product knowledge:

- `signAccessTicket({ subject, expiresAt, secret })` → `<expiresAt>.<hmac>`,
  where the HMAC-SHA256 covers `JSON.stringify([subject, expiresAt])`.
- `isAccessTicketValid({ ticket, subject, now, secret })` → boolean. Named for the
  sibling `isSecretHashValid`, and because a boolean-returning function here must
  read as a predicate.

Three properties are load-bearing:

- **The subject is signed but not transmitted.** The verifier already knows
  which subject is being requested and passes it in, so a ticket for run A
  simply fails to verify against run B. There is no "valid ticket, wrong
  target" state to get wrong.
- **The expiry is transmitted and signed.** The verifier needs to read it;
  covering it stops a bearer extending their own grant.
- **`now` and `expiresAt` are arguments, not clock reads.** Both functions
  stay pure and directly testable, and the TTL policy lives with the caller
  that owns it.

They sit beside `tokens/` in the same package but answer a different question:
a **token** is long-lived and revocable, identifies _who_, and costs a database
lookup; a **ticket** is short-lived, stores nothing, and grants _one subject,
briefly_. A read-only status stream needs the second.

### 2. Minting — `apps/admin_system`

`createRunStatusTicket` is called by the run-detail loader and nowhere else.
Reaching that line **is** the authorization decision: the `cqms` layout's
loader has already required a session, and the run resolved for this caller.
TTL is one hour.

It is a `.service.ts`, not a `.util.ts`, because it reads the environment and
the clock — the repo's purity rule pushes exactly this kind of function out of
`util`.

### 3. Verifying — `apps/scan-orchestrator`

`attachWebSocketServer` verifies before subscribing. Two failure modes are
deliberately kept distinct:

| Case                                                      | Response                              |
| --------------------------------------------------------- | ------------------------------------- |
| Unparseable JSON, not a subscribe message, malformed uuid | ignored, connection stays open        |
| Missing, expired, forged, or wrong-run ticket             | closed with **1008** Policy Violation |

A missing ticket is deliberately handled as _unauthorized_, not _malformed_.
Both would "work" — neither subscribes — but only one tells the client
anything. The `ticket` field is therefore optional to the Zod schema and
required by the verification step, which reads oddly for a line and is the
reason the schema carries a comment saying so.

The client, in turn, does **not** reconnect after a 1008. Every other close
retries with backoff; retrying this one would present the same rejected ticket
forever.

### 4. The secret — `CQMS_WS_TICKET_SECRET`

One value, required by both processes, **with no development default.**

This is the decision most worth recording, because the repo has a precedent
pointing the other way: `SESSION_SECRET` falls back to
`cqms-dev-insecure-secret`. That is tolerable for a cookie signer whose absence
degrades an already-working local session. It is not tolerable here. A shared
fallback would be a secret published in this repository, so anyone could mint a
valid ticket for any run — the control would be fully bypassed while every
component reported success. A guard that fails open is worse than no guard,
because it stops anyone from looking. A missing value fails loudly instead:
the orchestrator refuses to start, and the loader throws on first mint.

## Consequences

- **A new required environment variable**, documented in
  `apps/admin_system/.env.example` and `apps/scan-orchestrator/.env.example`.
  Both processes need the _same_ value; a mismatch rejects every subscription
  rather than failing open. `vp run dev:cqms` will not start without it.
- **Live updates can lapse without an error.** If a socket drops more than an
  hour after the last revalidation, the reconnect is refused and status goes
  quiet until the page is reloaded. In practice an updating run renews itself
  — each message revalidates, which re-runs the loader and issues a fresh
  ticket, which the client picks up via a ref so the reconnect uses the newest
  one. Surfacing the lapse in the UI is left for when the endpoint is actually
  hosted.
- **The orchestrator still learns nothing about _who_ is connected**, so it
  cannot log or rate-limit per user. That is a deliberate scope line: a ticket
  proves _someone authorized for this run_ is asking, which is the entire
  question a read-only stream must answer. Identity here would mean either a
  database in the WebSocket path or user data in the ticket, and neither buys
  anything until there is something to authorize beyond "watch this run".
- Tickets **cannot be revoked** before they expire; the hour-long TTL is the
  bound. Revocation would require exactly the state this design avoids.
- The primitives are generic, so the same mechanism is available for any later
  channel that must authorize at connect time without a session.

## Alternatives considered

- **Verify the session cookie in the orchestrator.** Requires sharing the
  session secret and the cookie format across two processes, and couples the
  orchestrator to the admin app's auth scheme. Strictly more coupling for the
  same answer.
- **Proxy `/ws/runs` through `apps/admin_system`** so the request is
  same-origin and the cookie applies. Genuinely viable, and the better shape if
  the orchestrator ever needs real per-user identity — but it puts a
  long-lived streaming proxy in the request path of the app, which is a much
  larger change than the gap warrants.
- **Send a per-user API token (ADR-029) from the browser.** Rejected: those are
  long-lived, carry the owner's full RBAC, and are meant never to reach a
  client. A leak would be far worse than the problem being fixed.
- **A dev-default secret** so nothing breaks. Rejected — see §4.
