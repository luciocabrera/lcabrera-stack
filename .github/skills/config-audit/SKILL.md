---
name: config-audit
description: Run claudelint check-all, triage findings against known project exceptions, and produce a prioritized fix plan for genuine issues. Use when reviewing AI config health or after modifying AGENTS.md, skills, hooks, or settings.
argument-hint: 'Optional: pass --verbose to see all skipped exceptions'
user-invocable: true
allowed-tools: Bash(claudelint *)
license: MIT
metadata:
  version: '1.0.0'
  scope: [root]
  auto_invoke: 'After modifying AGENTS.md, a skill file, hooks.json, or settings.local.json'
---

# Config Audit

Runs `claudelint check-all`, applies project-specific exception rules to suppress known false positives, and produces a prioritized fix plan for the issues that genuinely matter.

## When to Apply

- After modifying `AGENTS.md` / `CLAUDE.md`
- After adding or editing any skill in `.github/skills/`
- After changing `.claude/hooks/hooks.json` or `.claude/settings.local.json`
- Periodically as an AI config health check
- Before opening a PR that touches any agent config

## Step 1 — Run claudelint

!`claudelint check-all --format json`

Capture the full JSON output. Each entry in `validators` has `errors[]` and `warnings[]`. Process all validators.

## Step 2 — Triage Against Exception Rules

Apply these rules **before** building the fix plan. A finding that matches an exception is noise — record it in the "Skipped" count but do not add it to the plan.

### CLAUDE.md Validator — Exception Rules

| Pattern                              | Reason to skip                                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `File reference "src/..."`           | False positive — AGENTS.md declares all `src/` paths relative to `apps/react-router/`; claudelint checks from repo root          |
| `File reference "docs/..."`          | Same — `docs/decisions/` lives at `apps/react-router/docs/`                                                                      |
| `File reference "build/..."`         | Build output path, not a source reference                                                                                        |
| `File reference "path/to/..."`       | Placeholder in a command example, not a real path                                                                                |
| `File reference "design-system/..."` | Same relative-path false positive                                                                                                |
| `Too many sections (N, max 40)`      | Too aggressive — comprehensive project docs legitimately have many `###` subsections; the 40-section cap is not appropriate here |

**Override — always genuine**: if a `File reference` warning points to `skills/foo/SKILL.md` (missing the `.github/` prefix), that is a real stale path — add it to the fix plan.

### Skills Validator — Exception Rules

| Warning                                        | Reason to skip                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `Skill directory lacks CHANGELOG.md`           | Not required for project-internal skills                                      |
| `Skill frontmatter lacks "version" field"`     | Low value for project skills that never publish to a registry                 |
| `File reference \`references/...\` not linked` | Intentional — prose instructions telling which file to open, not broken links |
| `Unknown string substitution: $BASE`           | Project-specific bash variable in a shell script, not a skill substitution    |
| `Body too long (N lines)`                      | Arbitrary limit; complex skills like `react-19` legitimately need depth       |
| `Code block too long (N/40 lines)`             | Arbitrary limit; complete examples need full context                          |
| `Description missing trigger phrases`          | These skills use the `auto_invoke` frontmatter field instead                  |

**Never except — always genuine**:

| Error / Warning                      | Why it always matters                                                 |
| ------------------------------------ | --------------------------------------------------------------------- |
| `XML tag <...> outside code block`   | Breaks context parsing; use `{placeholder}` or reword                 |
| YAML frontmatter parse error         | Breaks skill loading entirely — the skill will not be invoked         |
| `Missing usage/instructions section` | Worth adding — improves skill discoverability and invocation accuracy |

## Step 3 — Build the Fix Plan

After triaging, emit a fix plan in this exact format:

```
## Config Audit Fix Plan

### Errors — must fix (N)
- [ ] [ValidatorName] [message] — [file:line if available] — [fix approach]

### Warnings — genuine, should fix (N)
- [ ] [ValidatorName] [message] — [file:line if available] — [fix approach]

### Skipped — known exceptions (N findings)
(list exception categories and counts, not individual items)
```

If there are zero genuine findings after triage, emit:

```
✅ Config audit clean — N findings matched known exceptions, nothing actionable.
```

## Saving the Plan

After producing the fix plan, **always** save it to disk without prompting the user:

1. Capture the current timestamp: `date +%Y%m%dT%H%M%S`
2. Create the output directory: `.tmp/config-audit/{timestamp}/`
3. Write the fix plan as `plan.md` inside that directory.
4. Tell the user the path to the saved file.

```
.tmp/
└── config-audit/
    ├── 20260625T143000/
    │   └── plan.md
    └── 20260626T091500/
        └── plan.md
```

## Fix Reference

### XML tag outside code block

Replace `<tag>` placeholders with `{tag}` or `[tag]`. If the tag appears inside a code fence that claudelint failed to detect (nested fences, `!` command blocks), either complete the tag (`<tag>...</tag>`) or rephrase the surrounding text.

```markdown
# ❌ broken — triggers XML tag error even inside backticks

`useFormStatus` must be called inside a `<form>`.

# ✅ fixed — rephrase to avoid angle-bracket HTML tag in prose

`useFormStatus` must be called inside a child component of a form element.
```

```markdown
# ❌ broken — timestamp placeholder looks like XML tag

Create directory: `.tmp/checker/<timestamp>/`

# ✅ fixed — use curly-brace placeholder

Create directory: `.tmp/checker/{timestamp}/`
```

### YAML frontmatter colon in unquoted value

```yaml
# ❌ broken — bare colon-space in value causes parse error
argument-hint: Target area, for example: src/

# ✅ fixed — quote the value
argument-hint: "Target area, for example: src/"
```

### Stale skill path in AGENTS.md

```markdown
# ❌ broken — path does not resolve from repo root

| `store-pattern` | ... | `skills/store-pattern/SKILL.md` |

# ✅ fixed

| `store-pattern` | ... | `.github/skills/store-pattern/SKILL.md` |
```

### Code leaked outside a code fence

If TypeScript/JSX content appears in prose, wrap it in a fenced block and close the fence before the next heading.
