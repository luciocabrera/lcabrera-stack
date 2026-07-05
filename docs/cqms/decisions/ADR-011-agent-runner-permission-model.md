# ADR-011: `packages/agent-runner` — SKILL.md loader and the Agent SDK permission model

**Status:** Accepted

## Context

Implementation Plan step 7, per TECH_SPEC §2.6: run the 3 non-deterministic
scanner skills (`fallow-code-checker`'s triage step, `code-smell-checker`,
`code-smell-zen`) as real Claude Agent SDK sessions, driven by the actual
`SKILL.md` file, with `cwd = targetProjectPath` and a tool allowlist derived
from the skill's own `allowed-tools:` frontmatter. Per the user's explicit
decision, this was verified with real, costed, live API runs rather than
deferred to mocked/unit-level testing — this ADR exists largely because
those live runs surfaced a chain of real bugs that no amount of type-
checking or inspection would have caught.

## Decision

1. **Package boundary**: `packages/agent-runner` has zero Postgres/
   `@repo/scan-ingestion` dependency. It produces `report.md`/`report.json`
   on disk and returns their paths; ingestion is a separate step the caller
   performs afterward (a skill's CLI step today, `admin_system`'s background
   job in step 9).
2. **SKILL.md loading reuses `scripts/validate-skills.cjs`'s own
   `parseFrontmatter`** (exported for this purpose), rather than
   reimplementing a frontmatter parser.
3. **`deriveAllowedTools.util.ts` exists because SKILL.md frontmatter and
   `.claude/settings.json` use different notations for the same
   information**: SKILL.md condenses `Bash(cat:*,date:*,git:*)` into one
   comma-joined group; `.claude/settings.json` (and the SDK's `allowedTools`
   array) expect one pattern per entry (`Bash(cat:*)`, `Bash(date:*)`, ...).
   Passing the condensed string through as a single entry is a real bug —
   caught only by a live run, where the SDK's matcher didn't understand it
   and denied everything, including commands the skill clearly intended to
   allow.
4. **The permission model — the substantial discovery of this step,
   arrived at only through repeated live runs, not reasoning from the SDK's
   type definitions**:
   - Bash/Read/Grep/Glob calls are resolved directly against `allowedTools`
     patterns, with no `canUseTool` involvement.
   - Write/Edit always route through the SDK's "ask" path.
     `permissionMode: 'dontAsk'` — the mode used throughout early attempts,
     since it matches "run unattended, deny anything not pre-approved" —
     **auto-denies the entire ask path without ever invoking `canUseTool`**,
     regardless of what's in `allowedTools` or the Settings-shaped
     `settings.permissions.allow` (the same `Tool(pattern)` syntax
     `.claude/settings.json` itself uses). No static pattern of any syntax
     grants Write under `dontAsk`. This was confirmed definitively by
     instrumenting `canUseTool` to log every invocation across isolated,
     minimal single-tool-call live tests: it was invoked zero times under
     `dontAsk`, across every pattern syntax tried.
   - `permissionMode: 'default'` + a `canUseTool` callback is the only
     combination that ever got a Write call approved. `canUseTool` fully
     replaces the interactive prompt `'default'` would otherwise show, so
     it never blocks on stdin in this fully unattended context.
   - **Final design**: `allowedTools` carries the skill's own derived Bash/
     Read/Grep/Glob patterns unchanged. `canUseTool` is the sole gate for
     Write, allowing only a `file_path` that starts with
     `${outputDirectory}/` and denying everything else (including any
     un-allowlisted Bash command or an `Edit` call) with an explicit
     message.
5. **The debugging path to that discovery, in order** (kept here since each
   step's wrong hypothesis is informative on its own):
   1. First live run: `subtype: 'success'`, real cost/turns, zero files
      written — the model treated "Saving the Report" as descriptive, not
      mandatory, once the skill was fed as a bare prompt rather than an
      interactive slash-command. Fixed with an explicit "you must actually
      execute every action, not describe it" preamble.
   2. Second run: the model correctly attempted to save, tried `Write`
      (denied) then `printf`/`echo` (also denied, not allowlisted) — never
      the one thing nominally granted (`cat`/`tee` via Bash).
   3. Third run (prompted toward `cat > file <<'EOF'`): tried exactly that
      heredoc form — still denied. Confirmed Claude Code gates Bash output
      redirection as its own capability, independent of command-prefix
      allowlisting — a real, separate security boundary, not a bug.
   4. Fourth run (bare `'Write'` string added to `allowedTools`): still
      denied. Write/Edit are path-scoped tools, not bare-name tools —
      confirmed via this repo's own `.claude/settings.json`
      (`"Write(.tmp/**)"`). Switched to `Write(${outputDirectory}/**)`.
   5. Fifth run (path-scoped Write grant, still under `dontAsk`): completed
      `'success'` but took ~38 minutes instead of ~1-2, and still failed to
      save. Root causes (both fixed, see below): the agent had no way to
      read back the resolved `OUTPUT_DIR` env var through its restricted
      Bash allowlist and fell back to a path outside the Write grant; and
      the skill's `../code-smell-shared/*.md` links are relative to the
      skill's location inside _this_ repo, unresolvable from
      `cwd = targetProjectPath` (a different repo) — the agent burned most
      of those 38 minutes on repeated whole-filesystem searches hunting for
      them, each a real 60-second timeout.
   6. Sixth run (OUTPUT*DIR stated directly in the prompt, absolute shared-
      docs path + `additionalDirectories`, `maxTurns` cap added): ~16 turns,
      much faster, but the Write call was \_still* denied — proving the
      path-scoped `Write(${outputDirectory}/**)` grant itself had never
      actually worked, in any prior run; every earlier "fix" had changed
      the syntax without changing the outcome.
   7. Isolated, minimal single-tool-call tests (no skill, no Bash, just
      "write this one file") is what finally isolated the true cause
      described in point 4 above, and confirmed the `default` +
      `canUseTool` fix in the cheapest possible reproduction before
      re-running the real, costed skill end-to-end.
6. **`maxTurns: 40`** added as a safety net against a repeat of the 38-minute
   run, independent of the root-cause fix above.
7. **Result-shape correction**: `RunSkillAgentResult.errorMessage` is now
   only populated from `permission_denials` when the run's `success` is
   `false`. A handful of denied calls the agent worked around on its own
   (e.g. tried `Edit`, got denied, used `Write` instead) are not failures
   and shouldn't populate `errorMessage` on an otherwise-successful run —
   per-run denial counts belong in the future `health_metrics` telemetry
   work, not overloaded onto this field.

## Consequences

- Any future Agent-SDK-driven tool in this repo that needs the agent to
  write files unattended must use this same `permissionMode: 'default'` +
  `canUseTool` pattern — `dontAsk` cannot grant Write/Edit under any
  circumstance, a fact easy to re-discover the hard way without this ADR.
- `admin_system`'s background job (step 9) inherits this same permission
  model unchanged when it eventually calls `runSkillAgent()` — no
  additional design work needed there for the permission boundary itself.
- The Node `--experimental-permission` OS-level sandboxing TECH_SPEC §2.6
  flags as "the highest-risk part of this spec" remains unimplemented —
  this ADR's permission model is a prompt/policy-level boundary (SDK-
  enforced), not an OS-level one. Still open, tracked separately.

## Verification performed

`vp fmt --check .`, `vp lint .`, `tsc --noEmit -p tsconfig.app.json`,
`vp run test` (3 test files, 12 tests, all pure/no live API calls) — all
clean. Separately, real live Claude Agent SDK runs (costed, not mocked):
7 full end-to-end attempts against the real `code-smell-checker` skill and
a real throwaway target repo, plus several cheaper isolated single-tool-call
reproductions used to pin down the `canUseTool`/`permissionMode`
interaction specifically — the final run produced a genuine, well-formed
`report.md` and `report.json` on disk (8 real findings against a
deliberately smelly fixture file), in 16 turns. All throwaway scripts and
`/tmp` scratch directories used across these runs were deleted afterward;
none of them called `ingestReport()`, so no CQMS database rows were ever
created by this verification work.
