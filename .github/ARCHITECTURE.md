# .github Architecture

Repository automation and agent-assistance assets.

## Purpose

- Centralize GitHub workflows and Copilot/agent guidance.
- Keep skill contracts stable and machine-validated.
- Ensure automation failures are caught in pull requests before merge.

## Directories

- `skills/` - Agent skills used for coding guidance and review workflows.
- `workflows/` - CI pipelines for quality gate, tests, performance, and skill validation.
- `copilot-instructions.md` - Root coding assistant instructions for this repository.

## Validation Contract

- Every skill directory must expose `SKILL.md` with valid frontmatter.
- Skill name in frontmatter must match the skill folder name.
- Relative documentation links in skill files must resolve to existing files.

## Tooling

- `scripts/validate-skills.cjs` validates skill contracts and references.
- `scripts/generate-skills-compliance-report.cjs` generates a markdown compliance report and appends progress logs.
- `.github/workflows/validate-skills.yml` runs skill validation plus report generation on pull requests and on pushes to `main`.

## Generated Artifacts

- `reports/skills/code-smell-compliance-report.md` - latest machine-generated skill compliance report.
- `reports/skills/agenting-plan-progress.md` - appended execution history and plan progress.
