# Scripts Architecture

Shared repository-level automation scripts.

## Purpose

- Centralize operational scripts used by multiple apps.
- Avoid duplicate script logic across packages.
- Keep security-sensitive command execution in one audited place.

## Current Scripts

- `seed-db.cjs` - seeds PostgreSQL using SQL assets in `apps/api-server/db/`.
  - Prefer host `psql` from fixed paths.
  - Fallback to `docker exec` into `postgres_container` when host `psql` is unavailable.
- `validate-skills.cjs` - validates agent skill contracts in `.github/skills`.
  - Checks required frontmatter fields (`name`, `description`, `license`).
  - Verifies frontmatter `name` matches the skill folder.
  - Verifies relative markdown links in each `SKILL.md` resolve.
- `generate-skills-compliance-report.cjs` - emits markdown compliance artifacts from skill validation.
  - Writes `reports/skills/code-smell-compliance-report.md`.
  - Appends run history to `reports/skills/agenting-plan-progress.md`.
  - Refreshes the compliance report.
  - Generates `reports/skills/fix-plan.md` from findings.
  - Generates `reports/skills/handoff-prompts.md` for planner/fixer/verifier agents.
  - Generates `reports/skills/handoff-runbook.md` with step-by-step flow and copy/paste prompts.
  - Generates `reports/skills/handoff-runbook-source-audit.md` focused on full source-audit remediation flow.
  - Appends run history to `reports/skills/agenting-plan-progress.md`.
  - Scans `apps/**` source files and detects high-signal maintainability/type-safety patterns.
  - Writes `reports/skills/code-smell-full-audit.md` using the shared smell report schema shape.
  - Appends run history to `reports/skills/agenting-plan-progress.md`.

## Root Script Entry Points

Defined in root `package.json`:

- `db:up` - starts local postgres via `docker/local/docker-compose.yml`.
- `db:status` - shows local docker compose status.
- `db:down` - stops local postgres.
- `seed` - runs shared seeding flow through `apps/api-server`.
- `db:seed` - convenience sequence: `db:up` then `seed`.
- `skills:validate` - runs `node scripts/validate-skills.cjs`.
- `skills:report` - runs `node scripts/generate-skills-compliance-report.cjs`.
  - Outcome: source findings report plus refreshed fix-plan/prompts/runbooks.

## Guardrails

- Resolve `psql` only from fixed system locations.
- Resolve `docker` only from fixed system locations when using fallback mode.
- Use a fixed safe `PATH` when spawning subprocesses.
- Require SQL paths to be absolute and derived from repository root.
- Keep script behavior package-agnostic so app scripts can call it via relative path.
- Keep reporting scripts deterministic and safe for CI artifact generation.
