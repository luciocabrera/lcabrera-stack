---
kind: plan
status: live
recorded: 2026-10-05
issues: ['#1260']
packages: [showcase]
---

# PRD — Eval history and regression tracking

> **What this file is.** The product requirements as written by Lucio Cabrera
> on 2026-10-05 (status: draft for stakeholder review), committed so every
> agent dispatched on epic
> [#1260](https://github.com/luciocabrera/lcabrera-stack/issues/1260) can read
> them. The design that answers them is
> [`eval-history-plan.md`](./eval-history-plan.md). Two edits were made on
> import, both also applied inside the hand-off prompt where they occur: a
> framework version in prose became the framework's name (AGENTS.md §7), and
> an embedded diagram became the sentence under it. The hand-off prompt at
> the end is reproduced as given and has been executed; the section after it
> says where the execution followed the repository over the prompt.

## Summary and problem

We will save every eval run in PostgreSQL. That includes its settings, model, cost, timings, tasks, trials and detailed outcomes. Reports and a dashboard will read from that history, so we can tell whether our skills, rules and agents are getting better or worse.

Today the four suites (rules-consistency, skills, verifier-fixtures, skill-quality) write their results to `.tmp/`, which git ignores and nothing keeps. That causes three problems:

- **No trend.** Each run stands alone, so we can't tell whether `react-19` triggers more reliably than it did last month.
- **No attribution.** When a result changes, we can't tell whether the skill text, the task, the judge prompt, the model or the harness caused it.
- **No noise baseline.** Quality scores moved by up to 0.4 between identical runs. With 2 tasks per skill and 1 trial each, one flip shifts a skill's score by 50%, so a real regression looks the same as noise.

The interactive explorer can only show one run's JSON at a time. It has no history to draw trends from.

## Goals, non-goals and success metrics

**Goals**

1. Save every run of every suite in PostgreSQL, down to each trial's outcome, with no manual step.
2. Make every result traceable: git SHA, content hashes of the skill, task, fixture and judge prompt, the model, the harness version and all settings.
3. Record cost and time for each run and each trial: input, output and cached tokens, USD, wall-clock, model latency and turn count.
4. Answer "did this change make things better or worse?" by comparing a branch against main, with flips listed and noise taken into account.
5. Show trends per skill, rule and agent over time, with marks where the skill changed or the model changed.
6. Keep deterministic CI exactly as it is today. History is added on top and never blocks a merge.

**Non-goals (v1)**

- Gating merges on model-based scores.
- Evaluating production agent sessions (only offline eval suites).
- Multi-tenant or multi-repo support. The schema allows a `project` column, but v1 has a single repo.
- Replacing Waza's task format. The YAML stays the source of truth.
- Calibrating the human-graded judge. v1 only stores the slots for it (see Phase 3).

**Success metrics**

| Metric                                 | Target                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Runs saved with full provenance        | 100% of runs from `vp run evals:*` and CI                                                                               |
| Time to answer "what changed vs main?" | Under 1 minute from the PR comment or the dashboard                                                                     |
| Noise floor known per suite            | A/A baseline recorded for every model suite before any regression rule is turned on                                     |
| Regressions explained                  | Every flagged regression points to one changed hash (skill, task, model, judge or harness), or is marked "unattributed" |
| Cost visibility                        | Cost per run and per skill shown, with a trend over the last 30 runs                                                    |

## Users and stakeholders

| Who                                             | Main question                                                                 | Where they look                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| Author of a skill, rule or agent prompt         | Did my edit make this skill trigger better or worse, and on which tasks?      | PR comment, run detail page              |
| Maintainer of the agent setup                   | Which skills are declining, flaky or overlapping with others?                 | Trend view, confusion matrix             |
| Whoever upgrades the default model              | Is the new model at least as good on our suite, and what does it cost?        | Model comparison view                    |
| Eval harness developer                          | Is the harness itself stable (errors, timeouts, tool lists that don't match)? | Run health panel                         |
| Showcase viewer (reviewer, interviewer, client) | How does this team measure AI quality, and how well does it work?             | Public read-only dashboard               |
| Coding agent (consumer)                         | What does the history say about the skill I'm about to edit?                  | CLI / SQL query, optional MCP tool later |

## Functional requirements

**FR-1 Capture (the runners)**

1. All four runners write one shared, versioned result envelope (JSON, `schema_version`). The current per-suite JSON becomes a projection of it.
2. Each run records:
   - its identity: run id, suite, trigger (local, CI on a PR, CI nightly, CI manual), actor, branch, git SHA, a dirty-tree flag, PR number
   - its settings: CLI arguments, model, `--runs`, concurrency, timeout, tools allowed, SDK and harness versions, Node version, OS
   - its timestamps: started, finished, and per trial: queued, started, first token, finished
3. Each trial records:
   - the task id and trial index
   - the outcome (pass, fail, error, timeout or skipped) and an error class
   - the graded details: skills invoked, fixture read, criteria marked `not-met`, verdict line, judge scores
   - tokens (input, output, cache read, cache write), USD cost, duration, turns
   - a pointer to the transcript
4. Hash at run time and save with each trial: SKILL.md, the task YAML, the fixture, `expected.json`, the judge prompt, the agent prompt (`refactor-verifier.md`) and the whole skill catalog. These hashes are what make a result traceable.
5. A runner must never lose results because Postgres is down. It writes the envelope to `.tmp/eval-results/` first, then sends it. A run that failed to send is sent later by `evals:ingest`.

**FR-2 Persistence**

1. Ingesting is idempotent, keyed on `run_id`. Re-ingesting the same run changes nothing.
2. Schema changes go through versioned migrations, using the stack's existing migration tool.
3. The ingester also accepts JSON files from CI artifacts and from `.tmp/`, so older runs can be loaded.
4. Transcripts stay as files (artifacts or object storage). The database keeps their path, size and hash. An optional, size-limited copy can live in the database.

**FR-3 Comparison and detection**

1. Compare two runs, or a branch against main. Output: a per-task flip list, the change in pass rate with confidence intervals, the change in cost and duration, and which hashes changed.
2. Flag a regression only when the drop is bigger than that suite's measured noise floor (see Statistics).
3. Mark a task as flaky when its trials disagree in more than X% of recent runs (X is set in config).
4. For trigger evals, compute precision and recall per skill and a confusion matrix showing which skill loaded instead of the expected one.

**FR-4 Reporting**

1. A CLI: `vp run evals:report -- --compare main` prints a markdown summary.
2. In CI, the same summary is posted as one PR comment that is updated in place, for PRs touching `.github/skills/`, `.claude/rules/`, `.claude/agents/` or `evals/`.
3. A dashboard (see the Dashboard section) and a JSON API that the existing explorer can load.

**FR-5 Operations**

1. A nightly or weekly scheduled run on main, set up as a separate workflow trigger. It is never a required check.
2. An A/A baseline command runs the same SHA N times and stores the noise floor for each suite.
3. A retention job applies the rules in Non-functional requirements.

## Data model (PostgreSQL)

The main entity is a trial: one execution of one task inside one run. Everything else either describes a trial (its run, task and model) or summarises trials (pass rates, baselines). The coding agent decides the exact DDL. This is the required logical model.

| Table                  | Grain                                    | Key columns (besides id and created_at)                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eval_run`             | One invocation of a suite                | `run_id` (uuid, unique), `suite`, `trigger`, `actor`, `branch`, `git_sha`, `git_dirty`, `pr_number`, `started_at`, `finished_at`, `status`, `model_id`, `harness_version`, `sdk_version`, `settings` (jsonb: CLI args, runs, concurrency, timeout, tools), `env` (jsonb: node, os, ci runner), `totals` (jsonb, denormalised: trials, passed, cost_usd, duration_ms) |
| `eval_subject`         | A thing under test                       | `kind` (skill, rule, agent, prompt), `name`, `path`                                                                                                                                                                                                                                                                                                                  |
| `eval_subject_version` | Content of a subject at a moment         | `subject_id`, `content_hash`, `first_seen_sha`, optional `content` snapshot                                                                                                                                                                                                                                                                                          |
| `eval_task`            | A task definition                        | `suite`, `subject_id`, `task_key` (for example `react-19/trigger`), `kind` (trigger, near-miss, fixture, quality), `tags`                                                                                                                                                                                                                                            |
| `eval_task_version`    | Content of a task at a moment            | `task_id`, `task_hash`, `fixture_hash`, `expected_hash`, `judge_prompt_hash`                                                                                                                                                                                                                                                                                         |
| `eval_trial`           | One execution                            | `run_id`, `task_version_id`, `subject_version_id`, `trial_index`, `outcome` (enum: pass, fail, error, timeout, skipped), `error_class`, `queued_at`, `started_at`, `first_token_at`, `finished_at`, `duration_ms`, `turns`, `tokens_in`, `tokens_out`, `tokens_cache_read`, `tokens_cache_write`, `cost_usd`, `transcript_uri`, `transcript_sha`                     |
| `eval_trial_detail`    | Suite-specific graded data               | `trial_id`, `detail` (jsonb, validated by a schema per suite: skills invoked, fixture read, not-met criteria, verdict, judge dimension scores, raw judge reply)                                                                                                                                                                                                      |
| `eval_tool_call`       | Optional, one row per tool call          | `trial_id`, `seq`, `tool`, `input_summary`, `at`                                                                                                                                                                                                                                                                                                                     |
| `eval_baseline`        | Noise floor per suite, model and subject | `suite`, `model_id`, `subject_id` (nullable), `git_sha`, `n_runs`, `mean`, `stddev`, `computed_at`                                                                                                                                                                                                                                                                   |
| `eval_annotation`      | Human notes on the timeline              | `at`, `kind` (model change, harness change, incident), `text`, `author`                                                                                                                                                                                                                                                                                              |
| `model_price`          | Price list for cost calculation          | `model_id`, `valid_from`, prices per million tokens for input, output, cache read and cache write                                                                                                                                                                                                                                                                    |

Rules:

- **Use real columns where we filter, jsonb where it varies.** Anything we filter or group on (outcome, model, suite, timestamps, cost) is a typed column. Detail specific to one suite goes in jsonb with a JSON Schema check.
- **Store cost twice.** Save the SDK's reported `total_cost_usd` as is, and also compute cost from `model_price`. The two can differ, especially on a subscription where the SDK figure is notional.
- **Use `timestamptz`, stored in UTC.**
- **Add these indexes:**
  - `(suite, started_at desc)`
  - `(git_sha)`
  - `(task_version_id, run_id)`
  - a partial index on `outcome <> 'pass'`
- **Add these views:**
  - `v_task_pass_rate` (per task, per run)
  - `v_subject_trend` (per subject over time)
  - `v_run_compare(a, b)` (a function)
  - `v_flaky_tasks`

## Statistics and regression detection

A change counts as a regression only when it is bigger than the noise we have measured. Every number shown in a report comes with its sample size.

1. **Pass rates** show a 95% Wilson interval and n, the number of trials. With fewer than 6 trials, the report shows "insufficient data" instead of a percentage.
2. **Noise floor.** `evals:baseline -- --runs N` (default 5) runs the same SHA and model N times and stores the mean and standard deviation per suite and subject. Each new model needs its own baseline.
3. **Regression rule (default):**
   - for a binary suite, the PR's pass rate falls below the lower bound of main's interval, **or** a task in the regression set that is not flaky flips from pass to fail in at least 2 of 3 trials
   - for a scored suite, the mean drops by more than 2 standard deviations of that suite's baseline

   Thresholds live in a config file, not in code.

4. **pass@k and pass^k.** Store both for each task across its trials. pass@k means at least one trial passed; pass^k means every trial passed. pass^k is the honest figure for reliability.
5. **Flaky tasks.** A task whose trials disagree in more than 20% of its last 10 runs is marked flaky. It is shown separately and left out of the regression rule until someone fixes it.
6. **Comparisons are fair.** Every comparison uses the same model, and the same harness version unless the diff is about the harness. When more than one hash changed, the report says "multiple causes" and does not guess.
7. **Regression set and capability set.** Each task is tagged as one or the other. Only the regression set can flag a regression. A capability task can be promoted once it passes reliably.

## Workstream B: making the suites reliable

History is only useful if the numbers in it can be trusted. Today a single flip moves a skill's score by 50% (2 tasks, 1 trial each), and quality scores move by up to 0.4 between identical runs. Workstream B fixes the suites themselves. It runs alongside Phases 1–4 and needs no database. Phase 2's regression rule only switches on once B1 and B2 are done.

| #   | Requirement                                                                                                                             | Why                                                                                                                          | Done when                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Measure the noise floor first.** Run an A/A test: the same commit and model 3–5 times per model suite.                                | The spread is the noise floor. Anything smaller is not a signal.                                                             | A baseline is recorded for skills, verifier and quality. Until Phase 1 lands it lives as a JSON file; after that, in `eval_baseline`. |
| B2  | **Write more tasks per skill.** Aim for 5–10 trigger tasks and 5–10 near-miss tasks per skill, in Waza format.                          | 2 tasks cannot tell noise from change. Near-misses on the same topic as another skill are what catch overlap between skills. | Every skill has at least 5 + 5. `evals:skills -- --check` enforces the minimum. Each new task was shown to fail with `--hide`.        |
| B3  | **Run at least 3 trials per task.** Make it the default `--runs` for the skills suite (the verifier already runs twice; raise it to 3). | One trial cannot separate a flaky task from a broken one.                                                                    | The default is 3, and cost per full run is documented.                                                                                |
| B4  | **Report pass rates with a confidence interval.** Use a Wilson interval and show n.                                                     | A rate without n and an interval invites over-reading.                                                                       | The runner's console output and the envelope both carry the interval and n.                                                           |
| B5  | **Use a threshold rule.** Flag a regression only when the drop is bigger than the noise floor (the rule in Statistics).                 | Stops chasing noise.                                                                                                         | The rule lives in config and is covered by unit tests, including a plant.                                                             |
| B6  | **Track flaky tasks separately.** A task that passes 2 of 3 times usually means the skill's description is ambiguous.                   | Flakiness is a finding about the skill, not just noise.                                                                      | Flaky tasks are listed per run with their trial split, left out of the regression rule, and each one gets a follow-up issue.          |
| B7  | **Tag each task as regression or capability.**                                                                                          | Regression tasks should be near 100%. Capability tasks are the ones we are trying to improve.                                | Each task has a `set` tag. Capability tasks are promoted once they pass reliably.                                                     |
| B8  | **Build a trigger confusion matrix.** Record which skill loaded instead of the expected one.                                            | With 18 skills, overlap between skills is the most likely regression.                                                        | The skills runner prints the matrix and stores the invoked skills for each trial.                                                     |
| B9  | **Track cost and latency as metrics.**                                                                                                  | A skill edit that doubles tokens at the same pass rate is still a regression.                                                | Tokens, USD, turns and duration are in every trial record.                                                                            |
| B10 | **Calibrate the judge.** Pin the judge model and prompt hash, and hand-grade a sample of 10 replies every quarter.                      | An unchecked LLM judge drifts silently.                                                                                      | Hand grades are stored next to the judge scores, and the agreement rate is reported.                                                  |
| B11 | **Turn real failures into tasks.** When an agent in real work picks the wrong skill or misses a rule, add it as a task.                 | Keeps the suite tied to real problems instead of guesses.                                                                    | A short how-to in `evals/README.md`, and a `source: incident` tag on the task.                                                        |
| B12 | **Rebaseline on every model change.**                                                                                                   | A new model shifts every number. Compared to the old baseline, everything looks like a regression or an improvement.         | Changing the default `--model` requires a new A/A baseline before any comparison.                                                     |

B1–B4 matter most and come first. B2 is mostly writing tasks, so it can be split per skill across several agents or PRs.

## Dashboard and where it lives

**Recommendation:** build the dashboard as an `/evals` feature inside the showcase app. Keep the data layer in its own package and its own Postgres schema, so the CLI and CI never depend on the app being up.

Runners write locally first. Only `evals:ingest` writes to Postgres, and every view reads from it.

**Views (all fed from the history tables)**

1. **Overview:** the last run per suite with status, pass rate and its interval, cost, duration and a trend sparkline. A banner lists any regressions on main.
2. **Run detail:** the trial table (task, trial, outcome, skills invoked, tokens, cost, duration, timestamps), filters, a link to each transcript, and the settings and environment.
3. **Compare:** pick two runs, or a branch against main. Shows the flip list first, then the changes in the totals, then which hashes changed.
4. **Subject trend:** for one skill, rule or agent, its pass rate over time with confidence bands. Marks show content-hash changes and model changes; clicking a point opens that run.
5. **Heatmap:** subjects down the side, recent runs across, coloured by pass rate. Flaky cells are hatched.
6. **Trigger confusion matrix:** expected skill against the skill that actually loaded.
7. **Cost and latency:** tokens and USD per run, per suite and per skill, with p50 and p95 duration.
8. **Quality scores:** the 5 rubric dimensions over time for each skill, each against its own baseline band.
9. **Run health:** error, timeout and rate-limit counts, and tool lists that didn't match.

The existing interactive explorer stays. It gains a "load from API" mode, so it can open any stored run as well as a local JSON file.

**Should the dashboard live in the showcase app?**

| Option                                                  | Pros                                                                                                                                                                                                                                                                                    | Cons                                                                                                                                                                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Inside the showcase app, at `/evals` (recommended)   | Dogfoods the stack (React Router framework mode, Postgres, the grid component) on real, changing data. One deployment, one auth and one design system to maintain. A strong showcase: viewers see how quality is measured, not just told. The grid and query-builder suit trial tables. | Ties the eval tooling to the app's release cycle and uptime. Risk of exposing prompts and transcripts publicly. Low or noisy scores are visible to outsiders without context. Eval data shares the app's database. |
| B. Separate app in the monorepo (`apps/eval-dashboard`) | Clean boundary, can be deployed and restarted on its own, nothing leaks into the product domain.                                                                                                                                                                                        | A second app to deploy and secure. Less showcase value. Duplicates layout, auth and design.                                                                                                                        |
| C. Static export into the explorer artifact             | No server, cheapest, works offline.                                                                                                                                                                                                                                                     | No live queries, no compare-on-demand, snapshots go stale, no PR deep-links.                                                                                                                                       |
| D. Generic BI tool (Metabase or Grafana) on Postgres    | Fast to stand up. Strong charts and alerts.                                                                                                                                                                                                                                             | Shows nothing about our own engineering, adds another tool to run, and is weak at drilling from a run down to a transcript.                                                                                        |

**How to make option A safe:**

- Put the data layer in `packages/eval-history` (schema, migrations, ingest, queries). The CLI, CI and the app all import it, and the app is just one reader.
- Use a separate Postgres schema `evals`, and give the app a read-only role.
- Run ingest only from the CLI and CI, never from the web app.
- Public routes show aggregates and task names only. Transcripts, raw prompts and judge replies sit behind auth or appear only in CI artifacts.
- The app runs behind a feature flag. If the app is down, CI still posts its PR comment straight from the package.

## Non-functional requirements

- **Reliability:** a run never fails because ingest failed. The local envelope comes first and sending happens afterwards (FR-1.5).
- **Performance:** ingesting a 36-trial run takes under 2 s. Each dashboard view answers in under 500 ms with 1 year of nightly history (about 15k trials).
- **Security:**
  - Database credentials come from env or CI secrets and never appear in logs.
  - The app uses a read-only role.
  - Transcripts can contain prompts and file contents, so they are private by default.
  - Secrets are scrubbed from transcripts before upload (the stack's existing hooks or a regex list).
- **Retention:**
  - trial rows and details are kept forever, since they are small
  - transcripts are kept for 90 days, except for runs on main and baseline runs, which are kept for good
  - optional `content` snapshots are kept for the last 20 versions of each subject
- **Testability:** the ingester, statistics and comparison logic get unit tests under `test:evals`, following the existing rule that judges are tested too. One integration test runs against Postgres in a container.
- **Portability:** local development uses docker compose Postgres. CI uses a Postgres service container for tests and a hosted Postgres for real history. The connection is configured by one `EVALS_DATABASE_URL`.
- **Observability:** the ingester logs one structured line per run, with run id, row counts and duration.

## Phasing and acceptance criteria

There are four phases. Each one is usable on its own, and each ends at a gate that must pass before the next one starts. Workstream B runs alongside them. Phase 2's regression rule can't be switched on until B1 (noise floor) and B2 (more tasks) are done.

**Phase 1: Capture and persist**

Shared envelope, hashing, `packages/eval-history` with migrations, ingest from the CLI and CI, and backfill from `.tmp/`.

- [ ] All 4 suites write the envelope with `schema_version`, and the explorer still loads it
- [ ] Running `vp run evals:skills -- react-19` creates 1 `eval_run` row and one `eval_trial` row per trial, with tokens, cost, durations and hashes filled in
- [ ] Ingesting the same envelope twice gives the same row counts
- [ ] With Postgres stopped, the run still succeeds, and `evals:ingest` sends it later
- [ ] A plant: changing one line of SKILL.md changes `content_hash` and nothing else

**Phase 2: Compare, baseline and report**

Statistics module, `evals:baseline`, `evals:report -- --compare`, and the PR comment.

- [ ] An A/A baseline (5 runs) is stored for skills, verifier and quality on the default model
- [ ] A plant: hiding a skill (`--hide`) produces a flagged regression that names the subject. An unchanged rerun produces none.
- [ ] The PR comment appears on a PR that edits a skill and is updated on new pushes, not duplicated
- [ ] The PR comment shows n and intervals, and says "insufficient data" when there aren't enough trials

**Phase 3: Dashboard in the showcase app**

The `/evals` routes: overview, run detail, compare, subject trend, heatmap, cost. Read-only role, feature flag, and the explorer's "load from API" mode.

- [ ] Each view answers in under 500 ms on a seeded dataset of 15k trials
- [ ] The public view shows no transcript or prompt text. This is checked by a test.
- [ ] Every chart point links through to its run and its trial

**Phase 4: Depth**

Confusion matrix, quality dimension trends, flaky-task view, run health, annotations, slots for human grades on the judge, nightly scheduled run, and the retention job.

- [ ] The nightly run on main has run for 7 days without a manual fix
- [ ] Flaky tasks are listed and left out of the regression rule

## Risks and open questions

**Risks**

| Risk                                                                   | Mitigation                                                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| With 2 tasks per skill, the statistics are too thin to detect anything | Write more tasks (5–10 per type) alongside Phase 2. Report "insufficient data" rather than a false signal. |
| Cost on a subscription is notional, so USD may mislead                 | Store the SDK figure and the computed figure separately, and label them in the UI                          |
| Usage limits run out halfway through a run                             | Mark trials as `error` with an error class, never `fail`. Keep a partial run and flag it as partial.       |
| Prompts or file contents leak through public transcripts               | Transcripts private by default, a scrubber, and a test on the public view                                  |
| Schema changes faster than the envelope                                | `schema_version` in the envelope, and the ingester accepts N and N-1                                       |
| Dashboard work crowds out eval work                                    | Phases 1 and 2 deliver value without the UI, so Phase 3 can slip                                           |

**Decisions needed from stakeholders**

- [ ] Where does the history database live: the showcase app's Postgres (separate schema) or a dedicated instance?
- [ ] Hosted Postgres provider for CI and nightly runs (and its free-tier limits)
- [ ] Is `/evals` public, partly public (aggregates only), or behind login?
- [ ] Where transcripts are stored: CI artifacts only, or object storage
- [ ] Nightly or weekly scheduled run, given the subscription usage budget
- [ ] Default regression thresholds (interval-based or 2 standard deviations), and the flaky-task threshold
- [ ] Should a coding agent get an MCP tool or CLI to query the history before it edits a skill (later phase)?

## Hand-off prompt for the coding agent

The prompt below is reproduced as the PRD gave it, with the same version edit
applied inside it as in the body (a framework version became its name). The
next section says how it was executed.

```markdown
# Task: produce an implementation plan for Eval History & Regression Tracking

You are planning, not implementing. Do not write production code, migrations or
workflow changes in this task. Your output is a plan document plus any ADRs it needs.

## Inputs (read all before planning)

1. docs/prd/eval-history.md: the PRD. It is the source of truth for WHAT. Do not
   change requirements; if one is unclear, infeasible or contradicts the repo, list it
   under "Questions for stakeholders" instead of deciding it yourself.
2. AGENTS.md, CLAUDE.md, .claude/rules/*, and the ADR folder: repo conventions, path
   rules and past decisions you must follow.
3. evals/: all four suites (rules-consistency, skills, skill-quality,
   verifier-fixtures), their runners (verify-*.mjs), their current JSON output and
   the unit tests run by `vp run test:evals`.
4. .github/workflows/agent-evals.yml: what runs where, and which checks are required.
5. The showcase app: its routing (React Router framework mode loaders/actions), its existing
   Postgres access layer and migration tool, auth, feature flags and design system /
   grid component.
6. The existing interactive results explorer (HTML) and the JSON shape it consumes.

## Constraints (non-negotiable)

- Deterministic CI stays the only required check. Nothing here may block a merge or
  make a run fail because the database is unreachable.
- The data layer lives in its own workspace package (proposed name
  packages/eval-history) used by the CLI, CI and the app. The web app only reads,
  using a read-only DB role, in a separate Postgres schema `evals`.
- Results are written locally first (.tmp/eval-results/), then sent. Ingest is
  idempotent on run_id.
- Reuse the repo's existing tools: pnpm, `vp run` tasks, its migration tool, its test
  runner, its lint and type-check gates. Add no new framework without an ADR.
- Every new check must be shown to fail on a deliberate plant, then the plant is
  reverted. This matches the existing evals practice.
- Transcripts and raw prompts never reach a public route.

## What the plan must contain

1. Current-state findings: how each runner produces results today, the exact fields
   available from the Agent SDK result (tokens, cost, timings, turns), and gaps
   against PRD FR-1. Cite file paths.
2. Envelope spec: the JSON Schema for the versioned result envelope, with one
   example per suite, and how the explorer keeps working with it.
3. Database design: DDL-level design for every table, enum, index and view in the
   PRD data model, with column types, constraints, jsonb validation strategy,
   and the migration sequence. Justify any deviation from the PRD.
4. Hashing: exactly which bytes are hashed for skill, task, fixture, expected,
   judge prompt, agent prompt and catalog, and how line endings and whitespace are
   normalised.
5. Statistics module: function signatures and the algorithms for the Wilson
   interval, pass@k / pass^k, the baseline, the regression rule and flaky detection,
   with config file format and defaults.
6. CLI surface: new `vp run` tasks (evals:ingest, evals:baseline, evals:report)
   with flags and example output.
7. CI changes: workflow steps, secrets (EVALS_DATABASE_URL), the PR-comment upsert,
   the scheduled run, and artifact retention.
8. Dashboard: route map under /evals, the loader query behind each view, the
   components reused from the showcase app, the public vs authenticated split, and
   the feature flag.
9. Work breakdown: PR-sized tasks grouped by the PRD's four phases plus
   Workstream B (suite reliability, B1-B12), which runs in parallel and needs no
   database. For B2 (more tasks per skill), propose the task list per skill and
   how to split the writing across parallel agents or PRs. Give each task its files
   touched, dependencies, its acceptance criteria copied from the PRD, its tests,
   and the plant that proves its check can fail. Phase 2's regression rule must depend on B1 and B2. Mark which tasks can run in
   parallel.
10. ADRs to write (title + one-paragraph decision each), at minimum: where the history
    DB lives, the envelope versioning, and the dashboard placement.
11. Risks and mitigations specific to this repo, beyond the PRD's list.
12. Questions for stakeholders, numbered, each with your recommended answer.

## Output

Write the plan to docs/plans/eval-history-plan.md and any draft ADRs to the ADR
folder with status "Proposed". Then reply with a short summary: the phase-1 task
list, the top 3 risks, and the open questions. Stop there and wait for review.
```

## How the hand-off was executed

The prompt named `docs/prd/`, `docs/plans/` and ADRs with status "Proposed" in
the ADR folder. This repository routes plans to `docs/agents/planning/` and
proposed decisions to `docs/agents/planning/adr-drafts/` without a number
([ADR-048](../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md)), so the
outputs landed there. The twelve sections the prompt required are the twelve
sections of [`eval-history-plan.md`](./eval-history-plan.md).
