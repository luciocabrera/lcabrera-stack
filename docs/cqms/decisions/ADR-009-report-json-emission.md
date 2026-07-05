# ADR-009: `report.json` emission added to the three existing scan skills

**Status:** Accepted

## Context

Implementation Plan step 5, built on ADR-007's `report.json` contract (`packages/scan-ingestion`'s `report.schema.ts`) and its CLI wrapper (`ingest.cli.ts`), both already implemented. Before editing anything, research confirmed this step is **entirely prompt-instruction work, not application code**: finding generation in all three skills is LLM judgment, not a deterministic script —

- `code-smell-checker`: 100% LLM analysis, no script at all in its skill directory.
- `code-smell-zen`: 100% LLM analysis; its only script (`collect-diff.sh`) collects raw diff text into the prompt, it doesn't compute findings.
- `fallow-code-checker`: hybrid — `run-fallow.sh` produces a real deterministic `fallow.raw.json`, but the triage/severity/fix-plan steps on top of it (SKILL.md steps 3–6) are LLM judgment.

So there is no separate script to "add JSON output to" for any of the three — the agent must write `report.json` itself, as a direct transcription of the same findings it just wrote to `report.md`, per each skill's own already-existing "Saving the Report" step.

## Decision

1. **One new shared doc, not three duplicated instruction blocks**: `.github/skills/code-smell-shared/REPORT_JSON_CONTRACT.md`, referenced by relative link from all three skills (matching the existing `SCHEMA_V1.md`/`REPORT_TEMPLATE.md` pattern). It specifies the exact JSON shape matching `report.schema.ts` field-for-field, and states plainly: **this is the same findings already written to `report.md` — author it directly from that, don't re-derive findings independently.**
2. **Two things called out loudly in the new doc, both already flagged as landmines in ADR-007's own code comments:**
   - **Flatten severity counts.** `SCHEMA_V1.md`'s Markdown nests them under `findings_count_by_severity: {blocker, high, medium, low, nit}`; `report.json` needs flat `blocker_count`/`high_count`/etc. top-level keys, because `ingestReport()` deliberately does no reshaping (ADR-007). This flattening has to happen when the JSON is written, i.e. here.
   - **Map non-canonical `status` values to `done`.** Real report.md files in the wild already use `status: resolved`, which isn't in the accepted enum (`open|in-progress|done|deferred`) and would make `ingestReport()`'s Zod parse reject the entire report. The new doc states this as a hard rule with `resolved` named explicitly, not left to be inferred.
   - Also specified: `finding_kind: 'duplication_group'` + `extra.instances` for `fallow-code-checker`'s clone-group findings only (per TECH_SPEC's note that a duplicate group's instance list doesn't fit the single-location finding shape) — `code-smell-checker`/`code-smell-zen` never emit this.
3. **Each skill's existing "Saving the Report" step gains two sub-steps**, not a new section: write `report.json` alongside `report.md` (referencing the shared contract doc), then invoke the CLI as a best-effort step —
   ```bash
   node --env-file-if-exists=docker/local/.env --env-file-if-exists=packages/scan-ingestion/.env --experimental-strip-types packages/scan-ingestion/src/cli/ingest.cli.ts --skill=<id> --run-dir="<dir>" --local-path="$(git rev-parse --show-toplevel)" [--raw-json=fallow.raw.json | --scope-type=diff --scope-value="<BASE>..HEAD"]
   ```
   Explicitly framed as **best-effort, non-fatal**: `report.md`/`report.json` are already saved to `.tmp/` regardless of whether ingestion succeeds, so a `cqms_db`-unreachable failure shouldn't be treated as a skill failure — this preserves the exact "history was previously entirely discarded, now it's persisted when possible" framing the whole CQMS effort is built on, without introducing a new failure mode for the skills' existing primary deliverable.
4. **`--env-file-if-exists=docker/local/.env --env-file-if-exists=packages/scan-ingestion/.env` are fixed, literal paths in the command** (not templated/computed) — the skills currently only ever run against `vite-react-compiler` itself (the ad hoc interactive-session case), so `packages/scan-ingestion` is always reachable at that fixed relative path from repo root. This is a deliberately narrow, current-scope choice: making this portable for scanning _other_ target repos (TECH_SPEC §2.6's `OUTPUT_DIR` convention change) is step 7's (`agent-runner`) job, not this one's.
5. **`allowed-tools:` frontmatter updated per skill** to permit the new invocation — added `node:*` to all three (only `fallow-code-checker` and `code-smell-zen` already had `bash:*`; `code-smell-checker`'s frontmatter was narrower than the other two — `Bash(cat:*,date:*,mkdir:*,tee:*)`, no `git:*` at all — so it also gained `git:*` for the `$(git rev-parse --show-toplevel)` substitution its new ingestion step needs). One new `.claude/settings.json` allowlist entry, single trailing-wildcard style matching the existing `run-fallow.sh*`/`collect-diff.sh*` entries, covering the exact fixed command prefix — one entry serves all three (and the future `linter-checker`) skills since the prefix is identical across all of them.

## Consequences

- `scripts/validate-skills.cjs` re-run clean (9 skill directories validated, `code-smell-shared` correctly skipped as a non-skill directory) — confirms frontmatter `name`-matches-folder and the new relative link (`REPORT_JSON_CONTRACT.md`) resolves.
- The `diff` scope path (`code-smell-zen`'s `--scope-type=diff --scope-value="<BASE>..HEAD"`) was verified end-to-end against a real temporary git repo and real Postgres rows — this exact scope-type combination hadn't been exercised in ADR-007's own verification (which used `repo` scope), so it was worth confirming directly rather than assuming.
- No CQMS consumer runs these skills unattended yet (that's `agent-runner`, step 7) — today this only affects interactive `/fallow-code-checker`, `/code-smell-checker`, `/code-smell-zen` sessions, which is the intended narrow scope for this step.

## Verification performed

`node scripts/validate-skills.cjs` — clean. Manual end-to-end run of the exact `ingest.cli.ts` invocation as written in `code-smell-zen`'s SKILL.md (`--scope-type=diff --scope-value="main..HEAD"`) against a real temporary git repository, confirmed via direct Postgres query that `cqms.scans.scope_type`/`scope_value` landed correctly, then cleaned up. (The `repo`-scope and `--raw-json` paths were already verified in ADR-007/ADR-008's own end-to-end CLI runs — not re-verified here since the command shape is unchanged, only the scope-type combination was new.)
