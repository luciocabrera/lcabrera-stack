# ADR-020: Self-scan + secret-file PreToolUse guard

**Status:** Accepted — **superseded in principle, not yet in code** (see below).

> **⚠️ Superseded by [PRD_V2.md](../PRD_V2.md) §9 (2026-07-11); the code below
> is still live.** §9 replaces host execution with an ephemeral container per
> run, which is a stronger boundary than this ADR's host-side guards. The
> [alignment review](../reviews/2026-07-11-codepulse-alignment-review.md) puts
> the follow-through in **Phase 2**: run agent-runner in-container, retire
> `assertSafeTargetPath`, and demote the secret-file guard to
> defence-in-depth.
>
> **Nothing has been retired.** `packages/agent-runner/src/assertSafeTargetPath.util.ts`
> and the PreToolUse hook are live, and scanners still execute **unsandboxed on
> the platform host** — so these guards are currently the only boundary there
> is, not a redundant layer. Treat them as load-bearing until Phase 2 lands.
> Current state: [STATUS.md](../STATUS.md) §3.2.

## Context

Phase-3 requirement (user-confirmed in the 2026-07-06 interview): the CQMS
app must be able to scan its own codebase with ALL scanners.
`assertSafeTargetPath` (agent-runner) rejected any target that _was_ the
CQMS repo root — a blanket ban that made agent self-scan impossible. The
real risk behind that ban is narrower than the ban itself: an unattended
LLM session running with `cwd = the CQMS repo` can read
`docker/local/.env` (live DB credentials), `apps/scan-orchestrator/.env`
(`ANTHROPIC_API_KEY`), and any key material — and nothing in the SDK's
static permission model stops an **allowlisted** `Read` or `Bash(cat:*)`
from doing so.

The deterministic scanners never had a repo-root block (their runner
scripts don't call agent-runner), so this step's unlock is specifically
the agent path.

## Decision

### 1. `assertSafeTargetPath` relaxation

Target **equal to** the CQMS repo root: now allowed. Target that
**contains** the repo (an ancestor like `$HOME`): still rejected — that
would hand the session everything around the repo too (`~/.ssh`, other
checkouts), scope the secret guard cannot meaningfully bound. Absolute +
exists checks unchanged.

### 2. Secret-file guard — a PreToolUse hook, not `canUseTool`

`runSkillAgent` wires `secretFileGuardHook` as a **PreToolUse hook**
(`matcher: 'Bash|Glob|Grep|Read'`) into `query()`. A hook is the only
interception point that works: the ADR-015-era live runs established that
statically-allowed tools are resolved **before** the ask path —
`canUseTool` never fires for them — and PreToolUse denies
(`hookSpecificOutput.permissionDecision: 'deny'`) cut in ahead of that
static allow (verified live against SDK 0.3.201/0.3.202, see below).

Three single-purpose utils in `packages/agent-runner`:

- `isSecretFilePath.util.ts` — pure basename predicate: the `.env` family
  (any `.env`, `.env.*`, `*.env` — except the `.example`/`.sample`/
  `.template` docs variants), `.envrc`, `.npmrc`, `.netrc`, `.pgpass`,
  `.git-credentials`, `.dockercfg`, `credentials(.json)`, SSH key
  basenames (`id_rsa*`, `id_ed25519*`, …), and key-material extensions
  (`.pem`, `.key`, `.p12`, `.pfx`). Case-insensitive.
- `collectToolInputPaths.util.ts` — per-tool extraction of path-like
  candidates: `Read.file_path`; `Glob.pattern`+`path` (glob wildcards
  stripped, so a dotenv-hunting pattern reduces to its `.env` basename);
  `Grep.glob`+`path` but deliberately NOT `Grep.pattern` (a content
  regex — grepping source for the string ".env" is legitimate); Bash
  commands tokenized on shell separators and `=` (catching
  `--env-file=...` flags). Unlisted tools yield nothing (Write is already
  output-directory-scoped by `canUseTool`).
- `secretFileGuardHook.util.ts` — the HookCallback: any candidate matching
  the predicate → deny with a reason instructing the agent to continue
  without the file. A deny is a normal, non-fatal event: the agent works
  around it, and `runSkillAgent` only surfaces denials on
  otherwise-failed runs.

Defense-in-depth boundaries, stated honestly: broad content greps are
covered by ripgrep's gitignore handling (real env files are gitignored),
not by this hook; the hook closes the explicit-path route (Read/cat and
targeted globs). Side effect that is desirable, not accidental: the
skills' best-effort "ingest into CQMS" Bash step references
`docker/local/.env`, so in a self-scan the guard also blocks the agent's
own ad hoc ingest — which would otherwise create a duplicate run next to
the orchestrator's own `ingestReport()` (the skills already treat ingest
failure as explicitly non-fatal).

## Verification performed

- agent-runner suite **57/57** (17 new: predicate table tests incl. all
  carve-outs, per-tool extraction tests, hook deny-shape/allow/no-op
  tests); lint + typecheck clean, re-verified after the overnight catalog
  bump to SDK 0.3.202.
- **Live SDK probe** (temporary script, deleted after): a real `query()`
  session with the hook wired exactly as runSkillAgent wires it, prompted
  to read `docker/local/.env` then `cat` it — **both denied**
  (`permission_denials: ["Read","Bash"]`), final answer acknowledged the
  denial and leaked no `DB_*` values; control probe (`Read package.json`)
  passed with zero denials and answered correctly.
- **Live E2E — the first real self-scan**: UI-triggered
  `code-smell-checker` scan of the registered CQMS-repo-root project ran
  through the orchestrator's agent branch (previously it failed at
  `assertSafeTargetPath` before the session even started). Succeeded in
  ~24 min (riding out a rate-limit event + API retries): 1570 files
  analyzed, 14 findings (1 BLOCKER / 2 HIGH / 6 MEDIUM / 4 LOW / 1 NIT)
  against real CQMS code, Step 5's `code_smell_checker_runs` master
  populated through the orchestrator path (created_by = system), findings
  view projecting all 14, and **zero findings referencing secret paths or
  values**. The run was kept — it is real quality data, not fixture
  garbage. (First attempt the night before failed on the Claude session
  limit — an environment condition, recorded here for the record.)
