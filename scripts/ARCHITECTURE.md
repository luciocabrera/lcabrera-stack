# Scripts Architecture

Shared repository-level automation scripts.

## Purpose

- Centralize operational scripts used by multiple apps.
- Avoid duplicate script logic across packages.
- Keep security-sensitive command execution in one audited place.

## Current Scripts

- The harness conformance gate (`harness:verify`) is `repo-verify-harness`,
  a bin of `@lcabrera/repo-standards`; its readers are the `conformance-*.cjs`
  modules beside it in that package. It reads its roster from disk on every
  run: skill directories under `.github/skills`, path rules under
  `.claude/rules`, subagent definitions under `.claude/agents`. Nothing lists
  them; a new artifact is covered the day it lands. What it holds them to — a
  `SKILL.md` per directory, frontmatter that parses and carries the fields its
  loader reads, every link and script path resolving, a description that says
  when the artifact applies — is stated in that package's README.
- `validate-skills.cjs` - the skills-only view of that same run, for the
  compliance report below (implementation in `lib/validate-skills-contract.cjs`,
  which imports the package's `conformance-*.cjs` readers by path, keeps the
  skill findings and projects them onto the report's shape). One
  implementation, two entry points: the gate cannot diverge from the report,
  and a rule or subagent finding is the gate's alone, since the report places
  everything it lists under `.github/skills/`.
- `generate-skills-compliance-report.cjs` - emits markdown compliance artifacts from skill validation.
  - Writes `reports/skills/code-smell-compliance-report.md`.
  - Appends run history to `reports/skills/agenting-plan-progress.md`.
  - Refreshes the compliance report.
  - Appends run history to `reports/skills/agenting-plan-progress.md`.
  - Scans `apps/**` source files and detects high-signal maintainability/type-safety patterns.
  - Appends run history to `reports/skills/agenting-plan-progress.md`.

## Root Script Entry Points

Defined in root `package.json`:

- `db:up` - starts local postgres via `docker/local/docker-compose.yml`.
- `db:status` - shows local docker compose status.
- `db:down` - stops local postgres.
- `harness:verify` - runs `repo-verify-harness`, which is also its own step in
  `.github/workflows/check-safe.yml`.
- `skills:validate` - runs `node scripts/validate-skills.cjs`.
- `skills:report` - runs `node scripts/generate-skills-compliance-report.cjs`.
  - Outcome: source findings report plus refreshed fix-plan/prompts/runbooks.

## Guardrails

- Use a fixed safe `PATH` when spawning subprocesses, and resolve the binary from
  fixed system locations rather than the caller's `PATH`.
- Keep reporting scripts deterministic and safe for CI artifact generation.

Database seeding is **not** here: each workspace owns its own DDL and its own
runner (`apps/showcase/scripts/seed-db.mjs`), so neither breaks when the
other's workspace moves — see
[ADR-071](../docs/decisions/ADR-071-split-the-demo-database-setup.md). That
split is what let the API servers leave for their own repository under #686
without touching the showcase's seeding at all.
