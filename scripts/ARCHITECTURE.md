# Scripts Architecture

Shared repository-level automation scripts.

## Purpose

- Centralize operational scripts used by multiple apps.
- Avoid duplicate script logic across packages.
- Keep security-sensitive command execution in one audited place.

## Current Scripts

- `validate-skills.cjs` - validates agent skill contracts in `.github/skills`
  (implementation in `lib/validate-skills-contract.cjs`).
  - Every directory under `.github/skills/` must have a `SKILL.md`, unless it
    is on the explicit support allowlist (`code-smell-shared`).
  - Checks required frontmatter fields (`name`, `description`).
  - Verifies frontmatter `name` matches the skill folder.
  - Verifies relative markdown links in each `SKILL.md` resolve.
  - Verifies relative script paths named from a `SKILL.md` or
    `.claude/agents/*.md` exist.
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
- `skills:validate` - runs `node scripts/validate-skills.cjs`.
- `skills:report` - runs `node scripts/generate-skills-compliance-report.cjs`.
  - Outcome: source findings report plus refreshed fix-plan/prompts/runbooks.

## Guardrails

- Use a fixed safe `PATH` when spawning subprocesses, and resolve the binary from
  fixed system locations rather than the caller's `PATH`.
- Keep reporting scripts deterministic and safe for CI artifact generation.

Database seeding is **not** here: each workspace owns its own DDL and its own
runner (`apps/react-router/scripts/seed-db.mjs`), so neither breaks when the
other's workspace moves — see
[ADR-071](../docs/decisions/ADR-071-split-the-demo-database-setup.md). That
split is what let the API servers leave for their own repository under #686
without touching the showcase's seeding at all.
