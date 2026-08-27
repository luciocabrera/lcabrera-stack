---
kind: summary
status: live
recorded: 2026-07-25
issues: ['#389', '#390', '#391', '#392', '#393']
packages: [server, showcase]
---

# Planning session — `@lcabrera/server` persistence hardening (2026-07)

> **Amended 2026-08-27 — three of the five epics below have closed.** E-1
> (#389), E-3 (#391) and E-4 (#392) were closed as of that date; E-2 (#390) and
> E-5 (#393) were still open. "High-level direction" is therefore the ranking
> this session **set and has since largely executed** — read it as what was
> decided in 2026-07, not as what to do next. The epic table stays as written,
> because resolving an old `P-07` reference to an issue number is the job that
> outlives the work. Re-derive the state rather than trusting this paragraph:
> `for n in 389 390 391 392 393; do gh issue view $n --json number,state,title; done`.

> **The backlog is on GitHub.** This is a **dated record** — the synthesis of
> the session that produced it, kept for the reasoning GitHub does not hold.
> Status, milestones, dependencies and acceptance criteria live on the issues
> themselves — that is what
> [ADR-036](../../decisions/ADR-036-github-planning-layer.md) makes canonical, so
> nothing here restates them.
>
> Orchestrator synthesis of a two-agent session (Systems Architect +
> Implementation Engineer) over
> [`architecture-improvement-plan.md`](./architecture-improvement-plan.md).

## Where the work is

Five epics, each with its children linked as real sub-issues, across milestones
M1–M5:

| Epic | Issue                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| E-1  | [#389](https://github.com/luciocabrera/lcabrera-stack/issues/389) — `@lcabrera/server` persistence hardening |
| E-2  | [#390](https://github.com/luciocabrera/lcabrera-stack/issues/390) — enterprise-orders correctness & security |
| E-3  | [#391](https://github.com/luciocabrera/lcabrera-stack/issues/391) — read-path performance                    |
| E-4  | [#392](https://github.com/luciocabrera/lcabrera-stack/issues/392) — self-healing governance                  |
| E-5  | [#393](https://github.com/luciocabrera/lcabrera-stack/issues/393) — observability (optional)                 |

The planning ids appear in each issue body's provenance line, so this map is what
resolves an old reference to one:

| Plan | Issue | Plan | Issue | Plan | Issue |
| ---- | ----- | ---- | ----- | ---- | ----- |
| P-01 | #394  | P-06 | #399  | P-11 | #404  |
| P-02 | #395  | P-07 | #400  | P-12 | #405  |
| P-03 | #396  | P-08 | #401  | P-13 | #406  |
| P-04 | #397  | P-09 | #402  | P-14 | #407  |
| P-05 | #398  | P-10 | #403  | P-15 | #408  |
| G-01 | #409  | G-02 | #410  | G-03 | #411  |
| G-04 | #412  |      |       |      |       |

`G-03` (register M1–M5) closed on creation: `plan:issues --create` creates the
milestones it assigns, so the task was done by the run that filed it.

The four unadopted proposals are in
[`adr-drafts/`](./adr-drafts/) and hold no ADR number until they are adopted
([ADR-048](../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md)).

## High-level direction

Adopt the improvement plan's ranking verbatim — the code review confirmed every
cited location is real and the two "High/correctness" claims are **live defects**:

1. **`@lcabrera/server` is the leverage point.** Error translation, the transaction
   seam, and pool tuning land once in the flagship package and every Node consumer
   (the apps and the server-side workspaces) inherits them. Two
   per-app reinventions already exist (`hasPostgresErrorCode.util.ts`,
   `runMigrations.ts` BEGIN/ROLLBACK) — evidence the abstractions are missing, not
   speculative.
2. **The two correctness/security defects lead.** The `order_id` read-then-write
   race (unhandled `23505`) and the mis-routed `customer_name` error are shipped
   today; the auth guard is off on three entry points. These outrank the perf work.
3. **Reject DDD ceremony.** No `dto/`/`mapper/`/`repository/` folders, no nominal
   repository interfaces, no repo-wide `neverthrow`. The suffix system + build-
   enforced `.server/` boundary already deliver the separation.

## Load-bearing nuance (from the feasibility pass)

**Atomic create is not "just a transaction."** `SELECT MAX(order_id)+1` on one
connection still races under READ COMMITTED without `FOR UPDATE`/advisory-lock or
retry-on-`23505` (or migrating to a real Postgres sequence — the house style on
the ingestion side). The `with-transaction` draft must pick the strategy; #400 implements
it. This is the highest-risk item and is sequenced late, behind the error layer
that turns a residual collision into a clean typed conflict.
