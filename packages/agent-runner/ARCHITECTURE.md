# agent-runner Architecture

Runs one of the three Agent-SDK-driven scanner skills (`fallow-code-checker`'s
triage step, `code-smell-checker`, `code-smell-zen`) as a real, unattended
Claude Agent SDK session against an arbitrary target project, and returns the
paths to whatever `report.md`/`report.json` it produced. See ADR-011 for the
full permission-model debugging history behind the current design — this
file describes the resulting shape, not how it was arrived at.

`linter-checker` (the 4th, fully-deterministic scanner) does **not** go
through this package at all — it has no LLM step, so it runs as a plain
child process (TECH_SPEC §2.5). `agent-runner` exists only for the three
scanners that genuinely need model judgment.

## Scope boundary

This package produces files on disk and returns their paths. It has **zero**
Postgres/CQMS-ingestion knowledge and no dependency on `@repo/scan-ingestion`
— the caller (a skill's own CLI step today; `admin_system`'s background job
in step 9) is responsible for calling `ingestReport()` afterward. Keeping
these separate means this package can be exercised and tested (including
real, costed live-API runs) without ever touching the database.

## File map

```
src/
├── index.ts                       → Barrel: runSkillAgent + its public types
├── runSkillAgent.ts                → The one exported function — see below
├── runSkillAgent.types.ts         → RunSkillAgentArgs / RunSkillAgentResult / ScannerId
├── cqmsRepoRoot.util.ts           → Resolves this repo's root from import.meta.url
├── skillFrontmatter.util.ts       → Loads + parses a real SKILL.md (reuses scripts/validate-skills.cjs's parser)
├── deriveAllowedTools.util.ts     → SKILL.md's condensed allowed-tools: string → one allowedTools[] entry per pattern
├── assertSafeTargetPath.util.ts   → Defense-in-depth: rejects a target path that is/contains this CQMS repo
└── __fixtures__/                  → Tiny SKILL.md fixtures for skillFrontmatter.util.test.ts only
```

## `runSkillAgent()` — what it actually does, in order

1. `assertSafeTargetPath(targetProjectPath)` — must be absolute, must exist,
   must not be (or contain) this CQMS repo. This is defense-in-depth only;
   the real authority check (`targetProjectPath` must match a row in
   `cqms.projects.local_path`) is the caller's job — this package has no DB
   access to perform that check itself.
2. `loadSkillFrontmatter({ skillPath })` — reads the real `SKILL.md` off
   disk (not a hand-copied prompt) and parses its frontmatter + body.
3. `deriveAllowedTools({ frontmatter })` — expands the skill's own
   `allowed-tools:` line into individual `allowedTools[]` entries. This
   covers Bash/Read/Grep/Glob; **Write is deliberately absent from this
   list** — see the permission model below.
4. Builds an explicit prompt preamble stating, in plain text: this is a
   fully autonomous, non-interactive session; the literal, resolved
   `outputDirectory` value (not an env var the agent would have to
   introspect through a restricted shell); and the absolute paths to the
   skill's own directory and the shared `code-smell-shared` docs directory
   (the skill body's own relative links, e.g. `../code-smell-shared/*.md`,
   only resolve relative to the skill file's location inside _this_ repo —
   meaningless once `cwd` is set to the target project, a different repo).
5. Runs the real Agent SDK `query()` with:
   - `cwd: targetProjectPath`
   - `additionalDirectories: [skillDirectory, sharedDocsDirectory]` — grants
     Read/Glob reach to the two absolute paths named in the prompt.
   - `allowedTools` — the skill's own derived Bash/Read/Grep/Glob patterns.
   - `canUseTool` — the sole mechanism that grants Write (see below).
   - `permissionMode: 'default'` — **not** `'dontAsk'`; see below.
   - `maxTurns: 40` — a safety net against a runaway session.
   - `env: { ...process.env, OUTPUT_DIR: outputDirectory }` — kept for the
     skills' own optional env-var convention, though the prompt now states
     the value directly rather than relying on the agent reading it back.
6. Streams every SDK message through `onProgress?.(describeMessage(message))`
   as it arrives (future `admin_system` WebSocket status push consumes this).
7. On the terminal `result` message, records `total_cost_usd`/`num_turns`/
   success-or-fail/`permission_denials`.
8. Verifies `report.md` and `report.json` actually exist in
   `outputDirectory` on disk — a `success: true` SDK result with the
   expected files missing is downgraded to `success: false`. This is the
   check that caught every one of the failure modes in ADR-011: the SDK
   reporting its own "success" was never sufficient evidence that anything
   was actually saved.

## The permission model — why Write needs `canUseTool`, not an allowlist

The single most important, and least obvious, fact about this package:
**Bash/Read/Grep/Glob and Write/Edit are gated by two entirely different
mechanisms in the Agent SDK, and no combination of `allowedTools` string
patterns or `settings.permissions.allow` entries ever grants Write.**

- Bash (and Read/Grep/Glob) calls are resolved directly against
  `allowedTools`'s patterns — matched and either allowed or denied without
  ever invoking a `canUseTool` callback. This is what lets the skill's own
  `allowed-tools:` frontmatter keep working unchanged.
- Write (and Edit) always route through the SDK's "ask" path. Under
  `permissionMode: 'dontAsk'`, that path is auto-denied outright —
  `canUseTool` is **never called at all** in that mode, regardless of what
  patterns are in `allowedTools` or `settings.permissions.allow`. This was
  confirmed by instrumenting `canUseTool` to log every invocation: it was
  never invoked once under `dontAsk`, no matter the pattern syntax tried.
- `permissionMode: 'default'` **does** invoke `canUseTool` for the ask path,
  and `canUseTool` fully replaces whatever interactive prompt `'default'`
  would otherwise show — so it never blocks on stdin in this unattended
  context. `runSkillAgent`'s `canUseTool` allows exactly one thing: a
  `Write` call whose `file_path` starts with `${outputDirectory}/`. Every
  other tool call that reaches `canUseTool` (an un-allowlisted Bash
  command, any `Edit` call) is denied with an explicit message.

Net result: `allowedTools` scopes the read-only/shell surface the skill
itself declared it needs; `canUseTool` is the sole, narrow gate for the one
mutating operation (`Write`) this session is allowed to perform, scoped to
exactly the directory the caller designated.

## Consumer map

Today: nothing calls this yet except the (deleted) throwaway live-test
scripts used to verify it end-to-end. Real consumers, per the Implementation
Plan: each of the 3 relevant skills' own CLI-driven flow once step 8/9 wire
scans to a UI trigger, and `admin_system`'s background job orchestrator
(step 9), which branches `scanner.deterministic ? runDeterministicScript() :
runSkillAgent()`.
