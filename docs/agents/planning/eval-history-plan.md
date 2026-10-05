---
kind: plan
status: live
recorded: 2026-10-05
issues: ['#1260']
packages: [showcase]
---

# Eval history: implementation plan

The design that answers [`eval-history-prd.md`](./eval-history-prd.md). The
work is filed as epic
[#1260](https://github.com/luciocabrera/lcabrera-stack/issues/1260) and its
34 sub-issues. Status, dependencies and acceptance criteria live on those
issues (ADR-036). This document holds the reasoning and the identifier map,
and it is a dated record: true as of 2026-10-05, amended above the body
rather than rewritten.

> **Amended 2026-10-05, after the first waves merged.** §1 describes the tree
> at `42f63c789`, the commit this plan was written against. Since then
> #1297 (session metrics), #1298 (many tasks per skill, `set`/`source`
> tags), #1304 (confusion matrix), #1309, #1314 (three trials by default),
> #1320 and #1321 (five-and-five task floor) and the B2 task batches have
> landed, so several §1 gaps are closed. `git show 42f63c789:<path>` shows
> what §1 read. One finding was missed outright: the tooled verifier runner,
> which §1.1 and the suite lists in §2 and §3 now include.

The PRD stays the source of truth for what to build. Where it contradicts the
repository, this plan says so and puts the call in
[§12](#12-questions-for-stakeholders) instead of deciding it here.

## Identifier map

The backlog was filed from a one-shot input by `vp run plan:issues`. Each
issue body names its planning id; this table resolves one.

| Plan | Issue | Plan | Issue | Plan | Issue | Plan | Issue |
| ---- | ----- | ---- | ----- | ---- | ----- | ---- | ----- |
| E-1  | #1260 | P-08 | #1269 | P-17 | #1278 | P-26 | #1287 |
| P-00 | #1261 | P-09 | #1270 | P-18 | #1279 | P-27 | #1288 |
| P-01 | #1262 | P-10 | #1271 | P-19 | #1280 | P-28 | #1289 |
| P-02 | #1263 | P-11 | #1272 | P-20 | #1281 | P-29 | #1290 |
| P-03 | #1264 | P-12 | #1273 | P-21 | #1282 | P-30 | #1291 |
| P-04 | #1265 | P-13 | #1274 | P-22 | #1283 | P-31 | #1292 |
| P-05 | #1266 | P-14 | #1275 | P-23 | #1284 | P-32 | #1293 |
| P-06 | #1267 | P-15 | #1276 | P-24 | #1285 | P-33 | #1294 |
| P-07 | #1268 | P-16 | #1277 | P-25 | #1286 |      |       |

## 1. Current-state findings

### 1.1 How each runner produces results today

The model runners parse arguments with `node:util` `parseArgs`, drop a
leading `--` (`withoutSeparator` in `evals/agent-sessions.mjs`), and batch
sessions with `chunk` + `runBatches`. The skills, verifier and quality
runners run four at a time (`CONCURRENCY = 4`); the tooled verifier runs one
at a time (`chunk(..., 1)`), since each fixture gets its own scratch worktree.
None takes a timeout or a tools flag. rules-consistency is the exception: it calls no
model, takes no flags and runs no sessions.

| Suite             | Runner                                                 | Flags                                                                                                                                             | Writes                                                                                                           | Kept in memory only                                                          |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| rules-consistency | `evals/rules-consistency/verify-rules-consistency.mjs` | none                                                                                                                                              | nothing; exit 1 on findings                                                                                      | the findings                                                                 |
| skills            | `evals/skills/verify-skill-triggers.mjs`               | skill names, `--check`, `--hide` (repeatable), `--model`                                                                                          | `.tmp/skill-evals/<skill>-<task>.json`: the raw SDK message array, which is the only transcript any suite keeps  | `{error, fixtureRead, invoked, passed, skill, task}`                         |
| verifier-fixtures | `evals/verifier-fixtures/verify-verifier-verdicts.mjs` | `--runs` (default 2, below 2 rejected); model hard-coded in `MODEL`                                                                               | `.tmp/verifier-evals/<fixture>-<n>.md`: the reply text only                                                      | `{expectedNotMet, fixture, matched, runs[{error, notMet, verdict}], stable}` |
| verifier-tooled   | `evals/verifier-fixtures/verify-verifier-tooled.mjs`   | `--runs`, `--keep`; the verifier with real tools in a scratch worktree, grading a fail-to-pass gate proof per fixture; sessions run one at a time | reports under `.tmp/`                                                                                            | per-fixture judgements                                                       |
| skill-quality     | `evals/skill-quality/verify-skill-quality.mjs`         | skill names, `--model`                                                                                                                            | `.tmp/skill-quality/<skill>.json` (raw reply), `runs/<iso>.json` (`{generatedAt, model, scores}`), `report.html` | `{skill, judgement{dimensions, overall, summary}}`                           |

skill-quality is the only suite with any history (`readHistory` over
`runs/*.json`), and it keeps one number per skill per run.

The five suites run in different places. rules-consistency is chained into
`check:push` and `check:safe`. `agent-evals.yml` runs `test:evals`,
rules-consistency, `waza check` and `evals:skills -- --check` in the
deterministic job on every PR, merge group and push. The skills job runs on
`workflow_dispatch` only. The verifier job runs on dispatch or on a same-repo
PR that touches the verifier, its contract or its fixtures. Both model jobs
upload `.tmp/` output for 7 days. Skill-quality and the tooled verifier
(`evals:verifier:tooled`) run in no workflow.

### 1.2 What the Agent SDK returns, and what is read

The runners call `query()` from `@anthropic-ai/claude-agent-sdk` (root
devDependency, `catalog:test`). Today they read four fields of the result
message: `type`, `subtype`, `is_error` and `result`. A grep for
`total_cost_usd|usage|duration_ms|num_turns|session_id|modelUsage` under
`evals/` returns nothing.

The result message already carries everything FR-1.3 asks for (types in
`node_modules/@anthropic-ai/claude-agent-sdk/sdk.d.ts`, the result message and
`ModelUsage`):

| PRD field                     | SDK source                                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tokens in / out / cache r / w | `modelUsage[model].inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens`, summed over models (the SDK documents `modelUsage` as the accounting source; `usage` covers the main loop only) |
| USD (reported)                | `total_cost_usd`, plus `modelUsage[model].costUSD`                                                                                                                                                                   |
| duration / model latency      | `duration_ms`, `duration_api_ms`                                                                                                                                                                                     |
| first token                   | `ttft_ms` (optional), added to the trial's start time                                                                                                                                                                |
| turns                         | `num_turns`                                                                                                                                                                                                          |
| error class                   | `subtype` (`error_during_execution`, `error_max_turns`, `error_max_budget_usd`, `error_max_structured_output_retries`), `api_error_status`, `terminal_reason`, or a throw caught by `drain()`                        |
| transcript key                | `session_id`; every runner sets `persistSession: false`, so the transcript is whatever the runner writes                                                                                                             |

Queued and started times are not in the SDK. The runner has to stamp them
around `query()`.

### 1.3 Gaps against FR-1

- No shared shape. Four runners never write their graded result; only
  skill-quality does.
- No cost, token, timing or turn field is read anywhere.
- No hash of any input is taken.
- Settings are partly implicit: the verifier's model cannot be changed, and
  `evals/skills/*/eval.yaml` declares `model: claude-sonnet-5.5` and
  `trials_per_task: 1` for Waza while the runner defaults to
  `claude-opus-5-5`. The envelope records what the runner used. The Waza
  value is a second declaration nothing reads at run time; this plan leaves
  it alone and names it as a risk (§11).
- At `42f63c789`, a skill could hold only one task of each kind:
  `REQUIRED_TASKS` in `evals/skills/skill-triggers.mjs` keyed tasks on the
  ids `trigger` and `near-miss`. #1298 (P-23 / #1284) replaced it with a
  kind taken from `should_trigger`, and #1321 now requires five of each.
- `evals/` is not a workspace. It has no `package.json`; its dependencies
  resolve from the root and `test:evals` is vitest with `--root evals`.

### 1.4 What the showcase offers, and what it does not

- Postgres is plain `pg`. The pool is `getPool()` in
  `packages/server/src/db/get-pool.util.ts`, built from the `DB_*` variables
  validated in `env.schema.ts`. `runQuery` always uses that pool (or a passed
  transaction), so `createTablePageReader` cannot point at a second database
  or role without a change to `@lcabrera/server`'s public API.
- `createTableRouteLoader` (`@lcabrera/ui`) takes a `fetchPage` function, so
  `TableRouteView` can render any rows a loader supplies. The `/evals` tables
  use that path (§8).
- There is no migration tool. `apps/showcase/scripts/seed-db.mjs` drops and
  recreates the tables each SQL file owns. A recommendation for
  `node-pg-migrate` exists only as prose in a skill.
- Auth exists (`apps/showcase/src/auth/`, a signed cookie and one demo
  credential), but `authMiddleware` is applied nowhere: a note in
  `routes/enterprise-orders/root.ts` says it broke client-side navigation into
  the subtree.
- There is no feature-flag mechanism. The one switch is the build-time
  `VITE_API_URL`.
- There is no chart library in any manifest or in the lockfile.
- Local Postgres is `postgres:latest` in `docker/local/docker-compose.yml` on
  port 5434. `e2e.yml` uses a `postgres:16` service; `check-safe.yml` uses
  `postgres:18-alpine` for the created-tree gate only.

## 2. Envelope spec

One JSON document per run, written to
`.tmp/eval-results/<suite>/<run_id>.json` before the runner exits. Transcripts
sit beside it in `.tmp/eval-results/<suite>/<run_id>/`. The schema is a Zod
schema in `@repo/eval-history` (`src/envelope/envelope.schema.ts`), and
`z.toJSONSchema` emits `envelope.schema.json` next to it for readers outside
TypeScript. A test fails when the emitted file is stale. Zod is already in
`catalog:runtime`; no JSON Schema validator is added.

```ts
type RunEnvelope = {
  readonly schema_version: 1;
  readonly run: {
    readonly run_id: string; // uuid v4, minted by the runner
    readonly project: 'lcabrera-stack';
    readonly suite:
      | 'rules-consistency'
      | 'skills'
      | 'verifier-fixtures'
      | 'verifier-tooled'
      | 'skill-quality';
    readonly trigger:
      'local' | 'ci-pr' | 'ci-push' | 'ci-scheduled' | 'ci-manual' | 'baseline';
    readonly actor: string; // GITHUB_ACTOR, else git user.email's local part
    readonly branch: string;
    readonly git_sha: string;
    readonly git_dirty: boolean;
    readonly pr_number: number | null;
    readonly started_at: string; // ISO 8601, UTC
    readonly finished_at: string;
    readonly status: 'complete' | 'partial' | 'aborted';
    readonly model_id: string | null; // null for rules-consistency
    readonly harness_version: string; // §5
    readonly sdk_version: string | null; // installed @anthropic-ai/claude-agent-sdk
    readonly baseline_id: string | null; // set by evals:baseline
    readonly settings: {
      readonly argv: readonly string[];
      readonly runs: number;
      readonly concurrency: number;
      readonly timeout_ms: number | null;
      readonly max_turns: number | null;
      readonly tools: readonly string[];
      readonly hidden: readonly string[];
      readonly selection: readonly string[];
    };
    readonly env: {
      readonly node: string;
      readonly os: string;
      readonly arch: string;
      readonly ci_runner: string | null;
    };
    readonly catalog_hash: string | null;
    readonly totals: {
      readonly trials: number;
      readonly by_outcome: Readonly<Record<Outcome, number>>;
      readonly pass_rate: {
        readonly n: number;
        readonly k: number;
        readonly rate: number | null;
        readonly lower: number | null;
        readonly upper: number | null;
      };
      readonly duration_ms: number;
      readonly cost_usd_reported: number | null;
      readonly tokens: Tokens;
    };
  };
  readonly subjects: readonly {
    readonly kind: 'skill' | 'rule' | 'agent' | 'prompt';
    readonly name: string;
    readonly path: string;
    readonly content_hash: string;
  }[];
  readonly tasks: readonly {
    readonly task_key: string; // e.g. 'skills/react-19/trigger-2'
    readonly subject: { readonly kind: string; readonly name: string };
    readonly kind:
      'trigger' | 'near-miss' | 'fixture' | 'quality' | 'rule-check';
    readonly set: 'regression' | 'capability';
    readonly source: 'incident' | null; // PRD B11; validated by --check since #1298
    readonly tags: readonly string[];
    readonly task_hash: string;
    readonly fixture_hash: string | null;
    readonly expected_hash: string | null;
    readonly judge_prompt_hash: string | null;
    readonly agent_prompt_hash: string | null;
  }[];
  readonly trials: readonly {
    readonly task_key: string;
    readonly trial_index: number;
    readonly outcome: Outcome; // 'pass' | 'fail' | 'error' | 'timeout' | 'skipped'
    readonly error_class: string | null;
    readonly queued_at: string;
    readonly started_at: string | null;
    readonly first_token_at: string | null;
    readonly finished_at: string | null;
    readonly duration_ms: number | null;
    readonly duration_api_ms: number | null;
    readonly turns: number | null;
    readonly tokens: Tokens;
    readonly cost_usd_reported: number | null;
    readonly model_usage: Readonly<Record<string, unknown>>; // modelUsage as returned
    readonly transcript: {
      readonly uri: string;
      readonly sha256: string;
      readonly bytes: number;
    } | null;
    readonly detail: SuiteDetail; // discriminated on suite, below
  }[];
};
```

`detail` per suite, each its own Zod schema with a `schema` tag the database
stores beside it:

| Suite             | `detail`                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| rules-consistency | `{schema: 'rules/1', check: 'indexed' \| 'covered' \| 'overlap', findings: string[]}`                                          |
| skills            | `{schema: 'skills/1', expected_skill, should_trigger, invoked: string[], fixture_read: boolean \| null, init_tools: string[]}` |
| verifier-fixtures | `{schema: 'verifier/1', fixture, expected_not_met: number[], not_met: number[], verdict: 'PASS' \| 'FAIL' \| null, matched}`   |
| verifier-tooled   | `{schema: 'verifier-tooled/1', fixture, expected_not_met: number[], not_met: number[], verdict, gate_proof_seen: boolean}`     |
| skill-quality     | `{schema: 'quality/1', judge_model, dimensions: {name, score, feedback}[], overall, summary, reply_sha256}`                    |

Raw judge replies and full reply text go to the transcript file, never into
`detail`. Graded prose does live in `detail`: the quality suite's `summary`
and each dimension's `feedback` are judge-written text. So `detail` is not
safe to serve as a whole, and the boundary for anything public is the
allow-list in §8.3, applied in the package's query functions; no route
returns `detail` unfiltered.

One example per suite lives in
`packages/eval-history/src/envelope/fixtures/<suite>.json`, and the schema
test parses every one. They are fixtures rather than copies in this document:
an example here would be a second schema nothing validates.

**The explorer keeps working.** `quality-report.mjs` gets a
`reportDataFromEnvelope(envelope, history)` that produces the shape
`reportData` produces today. The skill-quality runner calls it, so
`report.html` stays the same file built from different input. P-18 / #1279
then lets the template fetch an envelope instead of reading the embedded one.

## 3. Database design

Everything lives in schema `evals`. Table names follow the PRD. Ids are
`bigint generated always as identity` except `run_id`, which is the uuid from
the envelope. Every timestamp is `timestamptz`.

### 3.1 Enums

```sql
create type evals.outcome as enum ('pass', 'fail', 'error', 'timeout', 'skipped');
create type evals.trigger as enum ('local', 'ci-pr', 'ci-push', 'ci-scheduled', 'ci-manual', 'baseline');
create type evals.run_status as enum ('complete', 'partial', 'aborted');
create type evals.subject_kind as enum ('skill', 'rule', 'agent', 'prompt');
create type evals.task_kind as enum ('trigger', 'near-miss', 'fixture', 'quality', 'rule-check');
create type evals.task_set as enum ('regression', 'capability');
create type evals.annotation_kind as enum ('model-change', 'harness-change', 'incident', 'note');
```

`suite` is `text` referencing a lookup table, `evals.suite`, rather than an
enum or a check constraint. Every table that stores a suite (`eval_run`,
`eval_task`, `eval_baseline`) references it, so a misspelt suite fails at
insert instead of becoming a separate series in the views, and a sixth suite
is one inserted row, not a rewritten type or three edited constraints.

### 3.2 Tables

```sql
create table evals.suite (
  name text primary key
);

insert into evals.suite (name) values
  ('rules-consistency'), ('skills'), ('verifier-fixtures'), ('verifier-tooled'), ('skill-quality');

create table evals.eval_run (
  id bigint generated always as identity primary key,
  run_id uuid not null unique,
  project text not null default 'lcabrera-stack',
  suite text not null references evals.suite (name),
  trigger evals.trigger not null,
  actor text not null,
  branch text not null,
  git_sha char(40) not null,
  git_dirty boolean not null,
  pr_number integer,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  status evals.run_status not null,
  model_id text,
  harness_version text not null,
  sdk_version text,
  baseline_id uuid,
  catalog_hash char(64),
  schema_version smallint not null,
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  env jsonb not null check (jsonb_typeof(env) = 'object'),
  totals jsonb not null check (jsonb_typeof(totals) = 'object'),
  envelope_sha256 char(64) not null,
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table evals.eval_subject (
  id bigint generated always as identity primary key,
  kind evals.subject_kind not null,
  name text not null,
  path text not null,
  created_at timestamptz not null default now(),
  unique (kind, name)
);

create table evals.eval_subject_version (
  id bigint generated always as identity primary key,
  subject_id bigint not null references evals.eval_subject (id),
  content_hash char(64) not null,
  first_seen_sha char(40) not null,
  first_seen_at timestamptz not null,
  content text,
  created_at timestamptz not null default now(),
  unique (subject_id, content_hash)
);

create table evals.eval_task (
  id bigint generated always as identity primary key,
  suite text not null references evals.suite (name),
  subject_id bigint not null references evals.eval_subject (id),
  task_key text not null,
  kind evals.task_kind not null,
  task_set evals.task_set not null,
  source text check (source in ('incident')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (suite, task_key)
);

create table evals.eval_task_version (
  id bigint generated always as identity primary key,
  task_id bigint not null references evals.eval_task (id),
  task_hash char(64) not null,
  fixture_hash char(64),
  expected_hash char(64),
  judge_prompt_hash char(64),
  agent_prompt_hash char(64),
  created_at timestamptz not null default now(),
  unique nulls not distinct (task_id, task_hash, fixture_hash, expected_hash, judge_prompt_hash, agent_prompt_hash)
);

create table evals.eval_trial (
  id bigint generated always as identity primary key,
  run_id uuid not null references evals.eval_run (run_id) on delete cascade,
  task_version_id bigint not null references evals.eval_task_version (id),
  subject_version_id bigint not null references evals.eval_subject_version (id),
  trial_index smallint not null check (trial_index >= 0),
  outcome evals.outcome not null,
  error_class text,
  queued_at timestamptz not null,
  started_at timestamptz,
  first_token_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  duration_api_ms integer,
  turns smallint,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  tokens_cache_read integer not null default 0,
  tokens_cache_write integer not null default 0,
  cost_usd_reported numeric(12, 6),
  cost_usd_computed numeric(12, 6),
  transcript_uri text,
  transcript_sha char(64),
  transcript_bytes integer,
  transcript_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (run_id, task_version_id, trial_index),
  check (outcome <> 'error' or error_class is not null)
);

create table evals.eval_trial_detail (
  trial_id bigint primary key references evals.eval_trial (id) on delete cascade,
  detail_schema text not null,
  detail jsonb not null check (jsonb_typeof(detail) = 'object')
);

create table evals.eval_tool_call (
  trial_id bigint not null references evals.eval_trial (id) on delete cascade,
  seq smallint not null,
  tool text not null,
  input_summary text,
  at timestamptz,
  primary key (trial_id, seq)
);

create table evals.eval_baseline (
  id bigint generated always as identity primary key,
  baseline_id uuid not null,
  suite text not null references evals.suite (name),
  model_id text not null,
  subject_id bigint references evals.eval_subject (id),
  metric text not null check (metric in ('pass_rate', 'quality_overall')),
  git_sha char(40) not null,
  n_runs smallint not null check (n_runs >= 2),
  mean double precision not null,
  stddev double precision not null,
  computed_at timestamptz not null default now(),
  unique nulls not distinct (baseline_id, subject_id, metric)
);

create table evals.eval_annotation (
  id bigint generated always as identity primary key,
  at timestamptz not null,
  kind evals.annotation_kind not null,
  text text not null,
  author text not null,
  created_at timestamptz not null default now()
);

create table evals.eval_human_grade (
  trial_id bigint not null references evals.eval_trial (id),
  dimension text not null,
  score smallint not null check (score between 1 and 5),
  grader text not null,
  graded_at timestamptz not null default now(),
  primary key (trial_id, dimension, grader)
);

create table evals.model_price (
  model_id text not null,
  valid_from timestamptz not null,
  usd_per_mtok_in numeric(10, 4) not null,
  usd_per_mtok_out numeric(10, 4) not null,
  usd_per_mtok_cache_read numeric(10, 4) not null,
  usd_per_mtok_cache_write numeric(10, 4) not null,
  primary key (model_id, valid_from)
);
```

`eval_human_grade` is the slot PRD B10 asks for; it ships in P-20 / #1281's
migration, not the first one.

### 3.3 Indexes

```sql
create index eval_run_suite_started on evals.eval_run (suite, started_at desc);
create index eval_run_git_sha on evals.eval_run (git_sha);
create index eval_run_branch_suite on evals.eval_run (branch, suite, started_at desc);
create index eval_trial_task_run on evals.eval_trial (task_version_id, run_id);
create index eval_trial_not_pass on evals.eval_trial (run_id) where outcome <> 'pass';
create index eval_trial_transcript_expiry on evals.eval_trial (transcript_expires_at) where transcript_uri is not null;
```

The branch index is not in the PRD. "Branch against main" is the comparison
FR-3.1 names first, and it needs the latest run per branch and suite.

### 3.4 Views and the compare function

Added in P-15 / #1276, not in the first migration, because their shape
follows the dashboard's queries:

- `evals.v_task_pass_rate`: per run and task, `n`, `k`, pass@k, pass^k.
- `evals.v_subject_trend`: per subject and run, `n`, `k`, the run's
  `started_at`, model, and the subject's content hash, so a trend can mark
  where the hash changed.
- `evals.v_flaky_tasks`: per task, over its last 10 runs (the window comes
  from a parameter table the config writes, not a literal), the fraction of
  runs whose trials disagree.
- `evals.run_compare(a uuid, b uuid)`: a set-returning SQL function (the PRD's
  `v_run_compare(a, b)`; a view cannot take arguments) that returns one row
  per task in either run with both outcomes and both hash sets.

The Wilson interval and the regression rule stay in TypeScript (§6). Doing
them in SQL as well would make two implementations of one formula.

### 3.5 Deviations from the PRD, and why

| PRD                                        | Here                                                                         | Why                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| jsonb "with a JSON Schema check"           | Zod validation in the ingester, `detail_schema` column, `jsonb_typeof` check | Postgres has no built-in JSON Schema check, and `pg_jsonschema` is an extension many hosted providers do not offer. The ingester is the only writer (§8). |
| `cost_usd`                                 | `cost_usd_reported` and `cost_usd_computed`                                  | The PRD's own rule: store cost twice.                                                                                                                     |
| `v_run_compare(a, b)` as a view            | `evals.run_compare(a, b)` function                                           | A view takes no arguments.                                                                                                                                |
| `suite` (implied enum)                     | `text` referencing an `evals.suite` lookup table                             | Adding a suite should not rewrite a type, and the three tables that store one must agree on the list.                                                     |
| no `agent_prompt_hash` on the task version | added                                                                        | FR-1.4 hashes the agent prompt, and the verifier's result depends on it.                                                                                  |
| `eval_baseline` without a metric           | `metric` column                                                              | A binary suite's baseline is a pass rate and the quality suite's is a score; one table holds both.                                                        |

### 3.6 Migration sequence

1. `0001-schema.sql` (P-07 / #1268): schema, enums, every table above except
   `eval_human_grade`, indexes, `model_price` rows.
2. `0002-reporting.sql` (P-15 / #1276): views, `run_compare`, grants to the
   reader role.
3. `0003-grades-and-annotations.sql` (P-20 / #1281): `eval_human_grade`.
4. Retention needs no schema change; `transcript_expires_at` is set at ingest.

`model_price` rows come from `packages/eval-history/model-prices.json`,
upserted on every `evals:migrate`. Prices are taken from Anthropic's published
pricing on the day P-07 lands; this document does not copy them.

## 4. Migrator

No tool exists to reuse, and the choice is the subject of the P-01 draft
([`adr-drafts/eval-history-lives-in-a-private-workspace.md`](./adr-drafts/eval-history-lives-in-a-private-workspace.md)).
The recommendation is a small migrator in the package:

- Migrations are `packages/eval-history/migrations/NNNN-<slug>.sql`, applied
  in filename order.
- `evals.schema_migration (version int primary key, name text, sha256
char(64), applied_at timestamptz)` records each one.
- Each file runs in its own transaction after `pg_advisory_xact_lock` on a
  fixed key, so two CI jobs cannot migrate at once.
- An applied file whose checksum changed stops the run and names the file. A
  fix is a new migration.
- No down migrations. The history is append-only and a rollback is a forward
  fix.

It is about one screen of code over `pg`, which `catalog:backend` already
provides. `node-pg-migrate` was considered; the draft ADR records why it lost.

## 5. Hashing

Every hash is SHA-256, lowercase hex, over bytes normalized the same way:

1. Decode as UTF-8 and drop a leading BOM.
2. Replace `\r\n` and lone `\r` with `\n`.
3. Remove trailing newlines and append exactly one.

Nothing else is normalized. Trailing spaces are a line break in Markdown and
indentation is structure in YAML, so stripping either would hash two
different inputs equal.

A hash over several files is the SHA-256 of the concatenation, in sorted
relative-path order, of `<path>\0<normalized-file-hash>\n`. Renaming a file
therefore changes the hash; reordering a directory listing does not.

| Hash                 | Bytes                                                                                                                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| skill `content_hash` | every file under `.github/skills/<skill>/`, multi-file rule above. A body edit changes this hash only.                                                                                                                                                                              |
| catalog hash         | per skill, sorted by name: `name`, `description` and `paths` from the SKILL.md frontmatter, serialized as canonical JSON (sorted keys, no whitespace). It covers what the model sees when it chooses a skill, so a body edit leaves it unchanged and a description edit changes it. |
| rule `content_hash`  | the `.claude/rules/<rule>.md` file                                                                                                                                                                                                                                                  |
| agent `content_hash` | `.claude/agents/refactor-verifier.md`                                                                                                                                                                                                                                               |
| task hash            | the task YAML file (skills), the fixture's `change.diff` path plus `issue.md` (verifier), the rubric as canonical JSON (quality), the rule file path plus check name (rules)                                                                                                        |
| fixture hash         | `evals/skills/<skill>/fixtures/<name>/` multi-file (skills), `evals/verifier-fixtures/<fixture>/change.diff` (verifier)                                                                                                                                                             |
| expected hash        | canonical JSON of this fixture's entry in `evals/verifier-fixtures/expected.json`, so editing one fixture's expectation does not move the others                                                                                                                                    |
| judge prompt hash    | `judgePrompt` rendered with an empty skill body, plus the rubric as canonical JSON. The skill's own text is already in its `content_hash`.                                                                                                                                          |
| agent prompt hash    | the system prompt the runner sends (frontmatter stripped), plus `dispatch.md` and `docs/agents/refactor-verified-contract.md`                                                                                                                                                       |
| harness version      | the suite's runner, every `evals/` module it imports, and `evals/agent-sessions.mjs`, multi-file rule, first 12 hex characters                                                                                                                                                      |

## 6. Statistics module

Pure functions in `@repo/eval-history` (`src/stats/`). Thresholds come from
`evals/regression.config.json`, validated by a Zod schema at load.

```ts
type Rate =
  | {
      readonly kind: 'rate';
      readonly n: number;
      readonly k: number;
      readonly rate: number;
      readonly lower: number;
      readonly upper: number;
    }
  | { readonly kind: 'insufficient'; readonly n: number; readonly k: number };

declare const wilson: (args: {
  readonly k: number;
  readonly n: number;
  readonly z: number;
  readonly minN: number;
}) => Rate;
declare const passAtK: (outcomes: readonly Outcome[]) => boolean; // any pass
declare const passHatK: (outcomes: readonly Outcome[]) => boolean; // every trial passed
declare const summarize: (values: readonly number[]) => {
  readonly n: number;
  readonly mean: number;
  readonly stddev: number;
};
declare const binaryRegression: (
  args: BinaryRegressionArgs,
) => RegressionVerdict;
declare const scoredRegression: (
  args: ScoredRegressionArgs,
) => RegressionVerdict;
declare const flakyTasks: (
  history: readonly TaskRunOutcomes[],
  config: FlakyConfig,
) => readonly FlakyTask[];
declare const attribute: (
  a: HashSet,
  b: HashSet,
) =>
  | { readonly kind: 'single'; readonly changed: string }
  | { readonly kind: 'multiple'; readonly changed: readonly string[] }
  | { readonly kind: 'none' };
declare const triggerPrecisionRecall: (
  trials: readonly TriggerTrial[],
) => readonly {
  readonly skill: string;
  readonly precision: Rate;
  readonly recall: Rate;
}[];
```

- **Wilson.** `center = (p + z²/2n) / (1 + z²/n)`,
  `half = z·sqrt(p(1−p)/n + z²/4n²) / (1 + z²/n)`. `error`, `timeout` and
  `skipped` trials are excluded from n and reported beside it, because the
  PRD's risk table says a usage-limit failure must never count as a `fail`.
- **pass@k and pass^k** are per task over its trials in one run.
- **Baseline.** `summarize` uses the sample standard deviation (n − 1). A
  baseline with fewer than 2 runs is refused.
- **Binary rule.** Flag when the PR rate's point estimate is below main's
  Wilson lower bound, or when a regression-set task that is not flaky has
  `fail` in at least 2 of 3 trials on the PR and passed on main. Both runs
  must use the same model; the harness version must match unless
  `--allow-harness-change` is passed.
- **Scored rule.** Flag when the PR mean is below
  `baseline.mean − sigma × baseline.stddev`.
- **Flaky.** A task is flaky when, over its last `window` runs, more than
  `disagreeFraction` of them had trials that disagree.
- **Trigger precision and recall** (PRD FR-3.4), per skill, over the skills
  suite's valid trials (errors excluded, as for Wilson). Recall is the
  share of trials expecting the skill in which it loaded; precision is the
  share of trials in which it loaded that expected it. A trial that loaded
  two skills counts toward both. Each is a `Rate`, so it carries n and its
  Wilson interval, and falls back to `insufficient` the same way. The
  confusion matrix (#1294, #1280) is the same counts laid out by pair.

`evals/regression.config.json`, with the PRD's defaults:

```json
{
  "minTrialsForRate": 6,
  "z": 1.96,
  "binary": { "flip": { "failAtLeast": 2, "ofTrials": 3 } },
  "scored": { "sigma": 2 },
  "flaky": { "window": 10, "disagreeFraction": 0.2 },
  "baseline": { "defaultRuns": 5 }
}
```

The file sits in `evals/` rather than the package because it is a policy
about this repository's suites.

## 7. CLI and CI

### 7.1 Commands

The runners stay under `evals/`. The new commands get entry scripts there too,
matching the existing `evals:*` family in the root manifest, and import the
package.

| Command                                                      | Does                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `vp run evals:migrate`                                       | apply pending migrations to `EVALS_DATABASE_URL`; upsert model prices                                                           |
| `vp run evals:ingest [paths…]`                               | ingest envelopes (default `.tmp/eval-results/**`); `--quiet-unreachable` warns instead of failing, which is how runners call it |
| `vp run evals:baseline -- --suite <s> [--runs 5]`            | run one suite N times on a clean tree, tag the runs, write `eval_baseline`                                                      |
| `vp run evals:report -- --compare main [--suite s] [--json]` | flip list, rates with n and interval, cost and duration change, changed hashes; `--a <run> --b <run>` compares two runs         |
| `vp run evals:annotate -- --kind model-change "<text>"`      | add a timeline note                                                                                                             |
| `vp run evals:grade -- --trial <id>`                         | record a hand grade                                                                                                             |
| `vp run evals:retain`                                        | null out transcript pointers past `transcript_expires_at`; trim content snapshots beyond the last 20 per subject                |

Example `evals:report` output, with invented numbers for layout only:

```markdown
### skills: feat/1234-tighten-react-19 vs main (claude-opus-5-5)

| Task                      | main | PR  |
| ------------------------- | ---- | --- |
| react-19/trigger-3        | 3/3  | 1/3 |
| store-pattern/near-miss-2 | 2/3  | 3/3 |

Pass rate: 94.4% (n=540, 92.2–96.0) → 91.1% (n=540, 88.4–93.2). Below main's lower bound: regression.
Cost: $41.20 → $44.95 reported. Duration p50: 18.2 s → 19.0 s.
Changed: `react-19` content hash. One cause.
Flaky (excluded): `epic/trigger-4` (2/3, 3/3, 1/3 over its last runs).
```

Every command that connects reads one variable: `EVALS_DATABASE_URL` (writer)
for the CLI, `EVALS_READER_DATABASE_URL` for the app. A URL is never logged;
the ingester logs host and database name only.

### 7.2 CI

- **`agent-evals.yml`, deterministic job:** unchanged. P-09's acceptance
  criteria check that the diff does not touch it.
- **Suites with no CI job** (skill-quality, the tooled verifier): their
  envelopes reach history only through the local path, because each runner
  calls `evals:ingest` after writing its envelope (#1269). Giving either one
  a CI job is a separate decision, not part of #1270.
- **Model jobs:** each gains two steps after its run. One uploads
  `.tmp/eval-results/` as `eval-envelopes-<suite>`. The other runs
  `evals:ingest` with `continue-on-error: true`, and runs only when the secret
  is set, so a fork or a missing secret skips with a notice.
- **Package tests:** `@repo/eval-history`'s integration test needs Postgres.
  It reads `EVALS_TEST_DATABASE_URL` and skips with a printed reason when it
  is unset. `check-safe.yml`'s `quality-gate` job already runs a
  `postgres:18-alpine` service; the test gets its own database on it.
- **PR comment (P-14 / #1275):** a non-required job on PRs touching
  `.github/skills/`, `.claude/rules/`, `.claude/agents/` or `evals/`. It runs
  the affected skills (question 9), then `evals:report -- --compare main`, and
  upserts one comment found by `<!-- eval-history-report -->`. Without
  database access it compares against the latest `eval-envelopes-*` artifact
  from main.
- **Scheduled run (P-21 / #1282):** a separate workflow on `schedule` and
  `workflow_dispatch`, running the model suites on main with
  `trigger: ci-scheduled`, then `evals:retain`.
- **Artifact retention:** envelopes 90 days (the GitHub maximum), transcripts
  as today. "Kept for good" for main and baseline transcripts cannot be met
  with artifacts (question 4).
- **Secrets:** `EVALS_DATABASE_URL` (writer) for CI. `CLAUDE_CODE_OAUTH_TOKEN`
  is already there.

## 8. Dashboard

Placement and exposure are the P-03 draft
([`adr-drafts/serve-the-eval-dashboard-from-the-showcase.md`](./adr-drafts/serve-the-eval-dashboard-from-the-showcase.md)).

### 8.1 Routes

Declared in `apps/showcase/src/routes.ts`, one folder per route under
`apps/showcase/src/routes/evals/`, server code under `.server/` as the
existing routes do.

| Route                                | Loader query (`@repo/eval-history/queries`)                                       | Issue |
| ------------------------------------ | --------------------------------------------------------------------------------- | ----- |
| `/evals`                             | latest run per suite, `totals`, last 30 pass rates per suite, regressions on main | #1277 |
| `/evals/runs/:runId`                 | run header (settings, env) and a trial page via `fetchPage`                       | #1277 |
| `/evals/runs/:runId.json`            | the run's allow-listed projection (§8.3), never the stored envelope               | #1279 |
| `/evals/compare?a=&b=` or `?branch=` | `evals.run_compare(a, b)` plus `attribute()`                                      | #1278 |
| `/evals/subjects/:kind/:name`        | `v_subject_trend` for one subject, annotations in range                           | #1278 |
| `/evals/heatmap`                     | subjects × last N runs from `v_subject_trend`, flaky set from `v_flaky_tasks`     | #1278 |
| `/evals/cost`                        | tokens and both costs per run, suite and skill; p50/p95 duration                  | #1278 |
| `/evals/confusion`                   | expected skill × invoked skill over `eval_trial_detail` for one run or a range    | #1280 |
| `/evals/quality`                     | five rubric dimensions over time with each one's baseline band                    | #1280 |
| `/evals/health`                      | outcome × error class counts, tool-list mismatches                                | #1280 |

### 8.2 Reuse, and what is new

- The trial table is `TableRouteView` from `@lcabrera/ui`, fed by
  `createTableRouteLoader` with a `fetchPage` the package implements. The
  `createTablePageReader` path is not used, because it is bound to the
  showcase's `DB_*` pool (§1.4).
- Error boundaries: `RouteErrorBoundary` and `useNotifyOnError`, as every
  route does.
- Charts: sparkline, trend with bands, heatmap and matrix are drawn as SVG
  with StyleX. Four small shapes do not justify a charting dependency; the
  P-03 draft records the alternative.
- The reader pool is the package's own, built from
  `EVALS_READER_DATABASE_URL` and validated by a Zod schema in the package.

### 8.3 Public and private

The recommendation (question 3) is that every `/evals` route is public, with
nothing private behind it. No route returns transcript text, a prompt, a
judge reply or `eval_trial_detail.detail` fields other than an allow-list
(invoked skills, verdict, not-met numbers, dimension scores). The allow-list
lives in the query functions. A test renders every loader against a seeded
database and fails if any payload contains a planted marker string that the
seed put into transcripts and replies.

Login is not a v1 option: the auth middleware exists but is switched off
(§1.4), and fixing it is outside this epic.

### 8.4 Flag

`EVALS_DASHBOARD=1`, read on the server by each `/evals` loader through one
helper. Unset, the loaders throw a 404 `Response`. It is a server variable,
not a `VITE_` one, so it is not folded into the client bundle.

## 9. Work breakdown

The issues hold the acceptance criteria, files, tests and plants; this
section holds what they do not: the dependency shape and the order.

### 9.1 Graph

- **Decisions gate the build.** #1262 (history home and migrator) gates the
  package (#1265, #1268) and the views (#1276). #1263 (envelope versioning)
  gates #1265. #1264 (dashboard) gates #1276 and #1277. Nothing whose shape a
  pending decision would change is dispatched before it lands.
- **Phase 1:** #1265 → #1267 (runners), #1268 (migrator) → #1269 (ingest) →
  #1270 (CI). #1266 (session metrics) has no blocker.
- **Phase 2:** #1271 (stats) → #1272 (baseline), #1273 (report) → #1274
  (rule on) and #1275 (PR comment).
- **Workstream B into Phase 2:** #1274 is blocked by #1283 (A/A baseline
  recorded, which is B1) and #1291 (minimum tasks enforced, which closes B2).
  That is the PRD's "Phase 2's regression rule depends on B1 and B2".
- **Phase 3:** #1276 → #1277 → #1278, #1279.
- **Phase 4:** #1280, #1281, #1282.

### 9.2 Waves

At most three developers per wave, never two in one wave whose areas overlap
(`docs/agents/epic-orchestration.md` §4).

| Wave | Issues              | Why together                                                                                                                       |
| ---- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 0    | #1261               | this document                                                                                                                      |
| 1    | #1266, #1284        | no blockers; `agent-sessions.mjs` and runners vs `skill-triggers.mjs` and task YAML do not overlap                                 |
| 2    | #1262, #1263, #1264 | needs the stakeholder answers; three ADR adoptions, merged one at a time because `adr:verify` cannot see a sibling branch's number |
| 3    | #1265, #1294, #1285 | package scaffold; confusion matrix; first task batch                                                                               |
| 4    | #1267, #1268, #1271 | runners, migrator, stats: different directories                                                                                    |
| 5    | #1269, #1286, #1287 | ingest; two task batches                                                                                                           |
| 6    | #1270, #1273, #1292 | CI, report, three trials (#1292 touches runner flags after #1267 has landed)                                                       |
| 7    | #1272, #1288, #1289 | baseline command; two task batches                                                                                                 |
| 8    | #1275, #1290, #1293 | PR comment; last task batch; interval output                                                                                       |
| 9    | #1291, #1276        | task minimum; views and reader role                                                                                                |
| 10   | #1283, #1277        | A/A baselines (model budget, human-approved); overview and run detail                                                              |
| 11   | #1274, #1278, #1279 | rule on; second dashboard batch; explorer                                                                                          |
| 12   | #1280, #1281, #1282 | depth                                                                                                                              |

Phase 0 of the epic run re-derives this from the issues, which win where the
two differ.

### 9.3 B2: the task list per skill

Six batches of three, grouped so each batch writes near-misses among skills
whose topics touch. A near-miss on a neighbour's topic is what catches
overlap, and one writer holding all three sides writes them better than three
writers each holding one.

| Issue | Skills                                                             | Near-miss topics to cover                                                                                       |
| ----- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| #1285 | code-smell-checker, code-smell-zen, fallow-code-checker            | whole-tree audit vs diff review vs dead-code scan; "count lines", "explain this function"                       |
| #1286 | linter-checker, lint-toolchain, health-swarm                       | running lint vs configuring it vs a repo-wide rot sweep; fixing one lint finding by hand                        |
| #1287 | epic, refactor-verified, quality-gate-workflow                     | one issue vs an epic; running the gate vs certifying a change; "what does this CI job do"                       |
| #1288 | commit-and-pr, unslop, releasing                                   | writing a commit vs rewriting prose vs cutting a release; a changelog question that needs no release            |
| #1289 | react-19, react-router-framework-mode, store-pattern               | a component's form action vs a loader vs shared state; reading a component without changing it (fixture-backed) |
| #1290 | codebase-explorer, product-requirement, typescript-api-engineering | tracing a feature vs a consumer requirement vs API design; a one-file lookup                                    |

Each trigger task is shown to fail with `--hide <skill>` before it merges, and
each new task starts as `set: capability` and is promoted to `regression`
once repeated trials (#1292) show it passes reliably, as
`evals/skills/README.md` states. An earlier draft of this sentence said the
opposite; the README is the rule.

## 10. ADRs to write

Drafts in [`adr-drafts/`](./adr-drafts/), no number until adoption:

1. [`eval-history-lives-in-a-private-workspace.md`](./adr-drafts/eval-history-lives-in-a-private-workspace.md)
   (#1262). `@repo/eval-history` is a private workspace under `packages/`.
   It owns the envelope schema, hashing, statistics, migrations, ingest and
   queries, and connects only through `EVALS_DATABASE_URL` /
   `EVALS_READER_DATABASE_URL` to schema `evals`. Locally that is a separate
   database on the compose Postgres. Migrations are plain SQL files applied
   by a migrator in the package.
2. [`version-the-eval-run-envelope.md`](./adr-drafts/version-the-eval-run-envelope.md)
   (#1263). One envelope per run with an integer `schema_version`. A change
   that removes, renames or re-means a field bumps it; adding an optional
   field does not. The ingester accepts the current version and the one
   before it through an upcaster, and rejects anything else by name.
3. [`serve-the-eval-dashboard-from-the-showcase.md`](./adr-drafts/serve-the-eval-dashboard-from-the-showcase.md)
   (#1264). `/evals` in the showcase, every route public and aggregate-only,
   behind a server-side `EVALS_DASHBOARD` variable, charts in SVG with
   StyleX, reading through a role that can only SELECT.

## 11. Risks specific to this repository

| Risk                                                                                                                                                                                                                             | Mitigation                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AGENTS.md §1: a capability that serves neither the application stack nor the repo toolchain "is a signal to stop rather than to add a package". Eval history serves this repository's own agent setup, which is neither product. | `@repo/` scope, `private: true`, no changeset, nothing in `devkit` ships it. Question 8 asks for an explicit yes, because the rule says stop and this plan does not.           |
| The repository is public, so artifacts are downloadable by any signed-in GitHub user. The skills job already uploads full transcripts, which include repository file contents read during the session.                           | Same exposure as the source, which is public. A transcript can also hold environment output; the scrubber in #1269 runs before upload as well as before ingest. Question 4.    |
| `runQuery` is bound to `getPool()`, so the existing table-page reader cannot reach the evals database.                                                                                                                           | `fetchPage` backed by the package (§8.2). Changing `@lcabrera/server` to take a pool is a public API change for an app-only need, which ADR-039's reasoning argues against.    |
| Model budget. Assuming 18 skills × 10 tasks × 3 trials, a full skills run is 540 sessions and a 5-run baseline is 2,700, before the verifier and quality suites.                                                                 | #1292 measures and documents the real cost of one run. #1283 needs human approval to spend. The scheduled cadence is question 5.                                               |
| `adr:verify` allocates numbers against merged history, so three ADR branches in flight take the same number.                                                                                                                     | Wave 2 merges them one at a time and renumbers on rebase.                                                                                                                      |
| The `.mjs` runners import the package's TypeScript directly. That depends on Node stripping types from a symlinked workspace file whose real path is outside `node_modules` (probed on the local runtime).                       | The package uses erasable syntax only, and a test imports one entry from a plain `.mjs` file so CI catches a runtime that refuses. A `--preserve-symlinks` run would break it. |
| `vp run plan:issues` reads only the first line of a block-style `dependencies:` map, which is the style the issue template uses. This backlog's `blockedBy`, `parent` and `children` were dropped until rewritten in flow style. | Filed as #1296. Every issue here was checked after creation.                                                                                                                   |
| Waza's `eval.yaml` declares a model and a trial count the runner does not read.                                                                                                                                                  | The envelope records what ran. Aligning the two is out of scope; noted on #1292.                                                                                               |
| Local Postgres is `postgres:latest`; `unique nulls not distinct` needs 15 or later.                                                                                                                                              | CI images are 16 and 18. The migrator checks `server_version_num` and names the floor.                                                                                         |

## 12. Questions for stakeholders

Each has a recommendation. The issue that records the answer is in brackets.

1. **Where does the history database live?** Recommend: locally, a separate
   database `eval_history` on the existing compose Postgres, schema `evals`.
   It shares the container and nothing else, so `vp run --filter showcase
seed`, which drops tables, cannot reach it. (#1262)
2. **Hosted Postgres for CI and scheduled runs?** Recommend a free-tier
   serverless Postgres such as Neon, chosen by whoever owns the account,
   with `EVALS_DATABASE_URL` added as a secret. Until then CI ingest skips and
   history is local plus artifacts. This needs a human: it is an account and
   a credential. (#1262)
3. **Is `/evals` public?** Recommend public, aggregates only, with no private
   tier in v1, because the login guard is switched off (§1.4). Flag off by
   default in any deployment. (#1264)
4. **Where do transcripts live?** Recommend CI artifacts only, and amending
   the PRD's retention line: artifacts expire after 90 days at most, so
   "main and baseline transcripts kept for good" needs object storage, which
   adds a provider and a credential for a file nobody has asked to read after
   90 days yet. (#1264)
5. **Nightly or weekly?** Recommend weekly, given the session count in §11.
   Phase 4's acceptance criterion "nightly for 7 days" then becomes "four
   weekly runs without a manual fix". (#1282)
6. **Default thresholds?** Recommend the PRD's: interval rule for binary
   suites, 2σ for scored, flaky above 20% of the last 10 runs. They are in
   config and cheap to change once data exists. (#1271)
7. **An MCP tool for coding agents?** Recommend not in v1:
   `evals:report -- --suite skills --subject <skill>` answers the question
   from a shell, and an MCP server is a second interface to keep in step.
   (#1262)
8. **Proceed despite AGENTS.md §1's stop signal?** Recommend yes, as a
   private `@repo/` workspace that never ships, because the history is how
   both products' agent setup is measured. If the answer is no, Phases 1–2
   still fit in `evals/` with a JSON store, and Phase 3 does not happen.
   (#1262)
9. **Should PRs that touch skills run model suites?** FR-4.2 implies yes.
   Recommend: only the skills whose directory changed, or all of them when a
   `description` changed (the catalog hash moved), so a one-skill edit costs
   one skill's tasks. (#1275)
