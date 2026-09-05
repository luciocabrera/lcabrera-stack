# Scripts Architecture

Shared repository-level automation scripts.

## Purpose

- Centralize operational scripts used by multiple apps.
- Avoid duplicate script logic across packages.
- Keep security-sensitive command execution in one audited place.

## Current Scripts

- `verify-harness-conformance.cjs` - structural conformance for every
  agent-facing artifact (implementation in `lib/conformance-*.cjs`).
  - Reads its roster from disk on every run: skill directories under
    `.github/skills`, path rules under `.claude/rules`, subagent definitions
    under `.claude/agents`. Nothing lists them; a new artifact is covered the
    day it lands.
  - Every skill directory must have a `SKILL.md`, unless it is on the explicit
    support allowlist (`code-smell-shared`).
  - Frontmatter must parse and carry the fields its loader reads — `name` and
    `description` for a skill or subagent, `paths` for a rule — with `name`
    matching the directory or file it sits in.
  - Every relative markdown link must resolve from the file it is written in,
    which is where a renderer resolves it; a leading `/` means the repository
    root. Every script path named in prose or a command must resolve from the
    repository root, or from the file when it is written `./` or `../`.
  - A description must clear a mechanical floor: long enough to carry a
    situation, naming something concrete, and saying when the artifact applies
    rather than what it is. Judging a description that clears the floor is the
    model-in-the-loop tier, which this is deliberately not.
- `validate-skills.cjs` - the skills-shaped view of that same run, for the
  compliance report below (implementation in `lib/validate-skills-contract.cjs`,
  which projects the conformance result onto the report's shape). One
  implementation, two entry points: the gate cannot diverge from the report.
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
- `harness:verify` - runs `node scripts/verify-harness-conformance.cjs`, which
  is also its own step in `.github/workflows/check-safe.yml`.
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
