# CodePulse Alignment Review — Codebase, ADRs & Legacy Specs vs PRD v2

**Date:** 2026-07-11
**Yardstick:** [PRD_V2.md](../PRD_V2.md) (canonical, confirmed with product owner)
**Audited:** all 27 CQMS ADRs (`decisions/`), TECH_SPEC.md §2.1–§2.13, the original PRD.md, and the implementing code (verdicts carry verified file citations; three high-impact claims were independently spot-checked).
**Method:** four parallel audit passes + synthesis. Verdicts: **KEEP** (valid under PRD v2) · **REFACTOR** (survives, must change) · **DISCARD** (subject disappears) · **DRIFTED** (doc no longer matches code, independent of the pivot).

---

## 1. Executive Summary

The pivot from "internal tool scanning server-local checkouts" to "hosted multi-developer platform with synced snapshots and containerized execution" invalidates **less than half** of the recorded architecture. Of 27 ADRs: **12 keep, 11 refactor, 4 discard** (two of those are split verdicts where half the ADR survives). The persistence layer, standardized findings model, RBAC/audit system, admin UI shell, graph engine, and LLM usage metering all carry over. What breaks is concentrated in three seams:

1. **Ingestion** — everything keyed on `projects.local_path` (schema, resolvers, registration UI, path browsing) is superseded by the snapshot/sync model. Clean break confirmed: no data migration.
2. **Execution** — the Postgres LISTEN/NOTIFY **queue** (explicitly forbidden by PRD v2 §8) and **host-process scan execution** (replaced by ephemeral Docker containers, §9) must both be replaced; the queue's claim/reconciliation machinery (ADR-026) is discarded outright.
3. **Scanner authority** — two deliberate old decisions are now inverted: `command_template` is documentation while code-owned scripts execute (PRD v2 wants the DB-stored `scanner_command` to _be_ what runs), and on-disk skill folders are the authored source (PRD v2 makes the DB the source of truth with folder _export_).

The five largest **absences** (nothing in docs or code): snapshot storage/sync endpoints, the CodePulse CLI, browser archive upload, the Docker run container, and the Files Management epic.

---

## 2. Alignment Matrix — ADRs

| ADR | Title (short)                       | Verdict                   | Prio | One-line rationale                                                                                                                                                                                                                                           |
| --- | ----------------------------------- | ------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 001 | packages/ui extraction              | **KEEP**                  | —    | Product-model-agnostic UI foundation (§2, §11)                                                                                                                                                                                                               |
| 002 | ui scope widening + packages/api    | **KEEP**                  | —    | Reuse boundary stands (api → data-access per ADR-008)                                                                                                                                                                                                        |
| 003 | standalone tsconfigs                | **KEEP**                  | —    | Pure tooling                                                                                                                                                                                                                                                 |
| 004 | standalone quality gates            | **KEEP**                  | —    | Pure tooling                                                                                                                                                                                                                                                 |
| 005 | generic Form component              | **KEEP**                  | —    | Field-source-agnostic; PathField leaf dies with ADR-014                                                                                                                                                                                                      |
| 006 | CQMS schema provisioning            | **REFACTOR**              | HIGH | Mechanism keeps; `projects.local_path` key → snapshot reference (§3/§4); `fn_upsert_project` match-by-path retires                                                                                                                                           |
| 007 | scan-ingestion core                 | **REFACTOR**              | HIGH | `ingestReport()`/report.json keep (§7); local-path/git-root resolution + `--local-path` CLI arg retire; re-drive from run/snapshot context                                                                                                                   |
| 008 | api → data-access rename            | **KEEP**                  | —    | Shared pg pool/env still correct (§12)                                                                                                                                                                                                                       |
| 009 | report.json emission in skills      | **REFACTOR**              | MED  | Contract keeps (§7); skill self-ingest via CLI on dev machine → orchestrator-driven server-side ingestion (§9)                                                                                                                                               |
| 010 | linter-checker skill                | **DRIFTED + REFACTOR**    | MED  | Already split eslint/oxlint (ADR-019); must run in-container against snapshot (§9)                                                                                                                                                                           |
| 011 | agent-runner permission model       | **REFACTOR**              | MED  | Agent SDK + platform key keep (§5); `assertSafeTargetPath`/local-path targeting superseded by container sandbox (§9)                                                                                                                                         |
| 012 | admin_system CQMS routes            | **REFACTOR**              | MED  | UI shell keeps; `registerProject` (local_path) and `triggerScan` (queued rows) must become snapshot-ref + lock-or-409                                                                                                                                        |
| 013 | CRUD route restructure              | **KEEP**                  | —    | Model-agnostic UI plumbing                                                                                                                                                                                                                                   |
| 014 | path field + Form cancel UX         | **SPLIT: DISCARD / KEEP** | HIGH | PathField/PathBrowserModal/browseDirectory/browse route = prohibited server-filesystem exposure (§2, §13); Cancel/ConfirmDialog/useBackNavigate keep                                                                                                         |
| 015 | standalone scan-orchestrator        | **REFACTOR (heavy)**      | HIGH | Separate process + WS hub + transactional ingestion keep (§9/§10); LISTEN/NOTIFY queue and in-process host execution replaced by lock-or-409 + container pool                                                                                                |
| 016 | resolveLocalPath + scan toasts      | **SPLIT: DISCARD / KEEP** | MED  | Path canonicalization dies with local_path (§3); run-status toasts are §10's completion notification                                                                                                                                                         |
| 017 | RBAC schema + auth core             | **KEEP**                  | —    | Declared core product (§2, §12). Gap: `/ws/runs` WebSocket is unauthenticated — violates §12                                                                                                                                                                 |
| 018 | audit fields + functions-only DB    | **KEEP**                  | —    | Exactly §2/§4/§7's audit requirements; new snapshot tables must follow the same convention                                                                                                                                                                   |
| 019 | lint split + master/detail          | **REFACTOR**              | MED  | Data model keeps (§7); hardcoded script dispatch → in-container `scanner_command` execution (§5/§9)                                                                                                                                                          |
| 020 | self-scan + secret-file guard       | **DISCARD**               | MED  | Entire threat model (agent on host near server `.env`) removed by container isolation (§9); keep secret-basename predicate only as defense-in-depth                                                                                                          |
| 021 | workspace discovery + scoped scans  | **REFACTOR**              | MED  | Scoped scans/attribution views keep; live filesystem discovery from `local_path` in a GET loader → post-sync discovery against the snapshot                                                                                                                  |
| 022 | app-graph scanner                   | **REFACTOR**              | MED  | Engine/schema keep; opt-in selectable → always-on, hidden, non-disableable Type 3 (§5)                                                                                                                                                                       |
| 023 | scanner registry + artifacts        | **REFACTOR**              | HIGH | Registry keeps; two authority inversions: doc-only `command_template` → executable `scanner_command`; on-disk skill folders as source → DB as source with export (§5/§6). Missing `scanner_command`/`scanner_skill_name`/`scanner_skill_description` columns |
| 024 | user/role management                | **KEEP**                  | —    | Core product (§2); re-point `execute:scan` grant at the new trigger endpoint                                                                                                                                                                                 |
| 025 | findings ingest completeness        | **KEEP**                  | —    | Standardization Mandate correctness (§7)                                                                                                                                                                                                                     |
| 026 | atomic claim + stale reconciliation | **DISCARD**               | HIGH | Queue machinery forbidden by §8 ("no queuing, ever"); per-project reject already part-exists (migration 0021 advisory lock, verified); container-finalizer lifecycle replaces stale-scan sweeps (§9)                                                         |
| 027 | app-graph symbol nodes              | **KEEP**                  | —    | Directly serves §5 Type 3 + §12 indexing; rides ADR-022's always-on conversion                                                                                                                                                                               |

## 3. Alignment Matrix — TECH_SPEC & old PRD

| Section                              | Verdict                   | Prio | Note                                                                                              |
| ------------------------------------ | ------------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| §2.1 terminology                     | KEEP                      | —    | "Project" now = one repo, many machines (§4)                                                      |
| §2.2 canonical scan_findings         | KEEP                      | —    | = Standardization Mandate (§7)                                                                    |
| §2.3 DDL                             | REFACTOR + DRIFTED        | HIGH | local_path key, UUIDv4 (v7 required), no `is_readonly`; doc also 25 migrations stale              |
| §2.3a DB-owns-CRUD                   | DRIFTED (pattern KEEP)    | LOW  | All signatures stale post-0009/0021; pattern reinforced by §7/§8                                  |
| §2.4 shared ingestion                | DRIFTED (design KEEP)     | MED  | Closed scannerId union → open registry; `localPath` arg → snapshot handle                         |
| §2.5 linter skill                    | DRIFTED (design KEEP)     | LOW  | Split into eslint + oxlint (0010); `linter` retired                                               |
| §2.6 agent-runner invocation         | REFACTOR                  | HIGH | Host execution vs `local_path` → ephemeral container vs snapshot (§9)                             |
| §2.7 orchestrator + WS               | KEEP                      | —    | §10 allows WS; payload needs `event_type`/`scanner_type`/`percentage_complete`                    |
| §2.8 API surface                     | REFACTOR + DRIFTED        | MED  | new-project validates `{name, localPath}`; no 409 route; route table stale                        |
| §2.9 UI + JSON-as-table              | KEEP                      | —    | Built                                                                                             |
| §2.10 generic Form                   | KEEP                      | —    | Built                                                                                             |
| §2.11 catalog deps                   | KEEP                      | —    | Container/multipart deps are ADDs                                                                 |
| §2.12 guideline compliance           | KEEP                      | —    | Unaffected                                                                                        |
| §2.13 flagged items                  | KEEP                      | —    | Resolved in code                                                                                  |
| Old PRD locked-in 1,2,4,6,7,8,9      | KEEP                      | —    | Implemented, model-agnostic (2 has minor drift: linter split)                                     |
| Old PRD locked-in 3 (in-process job) | DISCARD                   | HIGH | Already superseded by orchestrator; doubly by containers (§9)                                     |
| Old PRD locked-in 5 (UUID PKs)       | REFACTOR                  | MED  | Intent keeps; v4 → **UUIDv7** (§4/§5)                                                             |
| Old PRD goals                        | KEEP                      | —    | All still §7/§11 goals                                                                            |
| Old PRD non-goals                    | DISCARD (3 of 4)          | HIGH | Graph = now core; local-paths-only = abolished; no-auth = inverted. CI triggers stay future (§13) |
| Old PRD user flows                   | REFACTOR (flow 1 DISCARD) | HIGH | Register-by-path + browse dies; trigger flow gains snapshot precondition + 409                    |

**Doc hygiene:** PRD.md and TECH_SPEC.md should get a "superseded by PRD_V2.md" banner; PRD_V1.md is the raw working transcript (keep as history or delete).

---

## 4. Ranked Misalignments (most product-breaking first)

1. **No ingestion path exists for the product's only ingestion model** — no snapshot storage, no sync endpoints, no CLI push, no archive upload; `projects.local_path` is the identity key end-to-end (schema → resolvers → forms). _(§3/§4; ADR-006/007/012/016; TECH_SPEC §2.3/§2.8)_
2. **Execution runs on the platform host, unsandboxed** — scanners execute in the orchestrator process against server paths; zero container code. Under a hosted multi-user model this is untenable (user-defined commands + skills on the host). _(§9; ADR-011/015/020; TECH_SPEC §2.6)_
3. **A queue the PRD forbids is the live orchestration backbone** — LISTEN/NOTIFY `cqms_scan_queued`, `queued` scan rows, atomic claim, stale-running sweeps. The per-project reject guard (0021) exists but surfaces as a form error, not the required `409 Conflict` + active `run_id` + elapsed time. _(§8; ADR-015/026)_
4. **Server-filesystem exposure is still a feature** — PathField/PathBrowserModal/browse-directory route implement what §13 declares a non-goal ("never expose the platform host's filesystem"). _(§2/§13; ADR-014)_
5. **Scanner authority is inverted twice** — DB `command_template` is decorative while hardcoded scripts run; on-disk `.github/skills/` folders are authored source instead of DB-export targets. The registry lacks `scanner_command` and the LLM skill fields entirely. _(§5/§6; ADR-019/023)_
6. **Files Management epic absent** — no `files` table, no M2M script/resource bindings to LLM scanners. _(§6)_
7. **Graph scanner is opt-in, not the mandated always-on shadow process**, and stops above variable/argument granularity. _(§5 Type 3; ADR-022/027)_
8. **Security gaps vs §12:** unauthenticated `/ws/runs` WebSocket; no CLI auth tokens; no per-run resource limits or egress policy (moot until containers land, then mandatory).
9. **Schema conventions:** UUIDv4 instead of UUIDv7; `is_readonly` missing (soft-delete/`enabled` exist).
10. **Progress UX below spec:** WS payload lacks `event_type`/`scanner_type`/`percentage_complete`; no completion webhooks; delta-vs-previous-run view only partial (trend view exists).

---

## 5. ADR Supersession List

Accepted ADRs are never edited; each entry below becomes a new superseding/amending ADR when its work lands:

| New ADR (proposed)                                                                                       | Supersedes / amends                                                                | Records                                                                         |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Snapshot ingestion (sync-then-scan, latest-wins; CLI push + archive upload; clean break from local_path) | supersedes ADR-014 (path half), ADR-016 (resolver half); amends ADR-006/007/012    | §3/§4 model, snapshot schema, no-migration decision                             |
| Ephemeral container execution                                                                            | supersedes ADR-020; amends ADR-011/015; answers ADR-011's open OS-sandbox question | §9 lifecycle, caching, limits, egress policy, host-side transactional ingestion |
| Lock-or-409 orchestration (no queue)                                                                     | supersedes ADR-026; amends ADR-015                                                 | §8 semantics, 409 payload contract, finalizer-guaranteed teardown, WS auth fix  |
| DB-authoritative scanners (executable `scanner_command`, skill fields, folder **export**)                | amends ADR-019/023                                                                 | §5/§6 authority flip + Files epic schema                                        |
| Always-on graph scanner                                                                                  | amends ADR-022                                                                     | §5 Type 3 hidden auto-injection + depth roadmap                                 |

Plus doc hygiene: superseded-banner on PRD.md/TECH_SPEC.md pointing to PRD_V2.md.

---

## 6. Implied Implementation Backlog (phased)

**Phase 1 — Ingestion foundation** _(unblocks everything; ADR-006/007/012/014/016 changes)_

- Snapshot entity + storage (server workspace dir or object store), `projects` snapshot-reference columns (`latest_snapshot_id`, `synced_at/by`, source machine), drop `local_path` (clean break — consider whether the dev DB is simply re-provisioned rather than migrated).
- Browser archive upload route (multipart zip/tar → unpack → replace snapshot) + project-page sync panel.
- CodePulse CLI push (pack tree honoring ignore rules → authenticated push) + per-user revocable API tokens.
- New-project/edit-project forms lose PathField; delete `PathField/`, `PathBrowserModal/`, `browseDirectory.loader.ts`, `_action/browse-directory`.
- "Trigger with no snapshot = error" precondition.
- UUIDv7 defaults + `is_readonly` while touching the schema.

**Phase 2 — Containerized, queue-free execution** _(ADR-011/015/019/020/026 changes)_

- Docker run lifecycle: provision → unpack latest snapshot → dependency install (`needs_install` flag, §14.2) → parallel scanner pool → artifact collection → guaranteed teardown; base-image + package-store caching; CPU/mem/wall-clock limits; egress blocked during scan (allowlist Anthropic API for LLM scanners).
- Replace queue: retire `0007_scan_queued_notify`, `claimQueuedScan`, `failStaleRunningScans`, `listenForQueuedScans` drain loop; promote the 0021 advisory-lock guard into the full HTTP `409` contract (active `run_id` + elapsed) and live-status trigger-disable.
- Server-side ingestion from container artifacts replaces the skills' self-ingest CLI step; agent-runner runs in-container (retire `assertSafeTargetPath`, demote secret-file guard to defense-in-depth).
- Authenticate `/ws/runs`.

**Phase 3 — Scanner platform** _(ADR-019/022/023 changes + Files epic)_

- `files` table + M2M scanner-asset bindings (`type: script|resource`), authored via UI, DB as source of truth.
- Registry columns: executable `scanner_command` (Type 1), `scanner_skill_name`/`scanner_skill_description` (Type 2); in-container execution of DB-defined commands; flip `writeScannerArtifacts` to the export direction (DB → skill folder).
- Graph scanner: hidden auto-injection on every run; deepen extraction toward variables/argument signatures.

**Phase 4 — Progress & polish**

- Rich event payload (`event_type`, `scanner_type`, `percentage_complete`), completion webhooks/toasts with quick stats, delta-lines vs previous run, 409 alert banner.

---

## 7. Feasibility & Open Questions (carried from PRD v2 §14 + new)

1. **Diff-based scanning** (code-smell-zen): proposal stands — CLI push includes minimal git metadata (branch + merge-base); snapshot-vs-snapshot as fallback; browser uploads whole-tree only. **Needs owner sign-off.**
2. **Dependency install**: per-scanner `needs_install` + shared package-store cache. **Sign-off.**
3. **Arbitrary `scanner_command` is remote code execution by design** — acceptable only inside the Phase-2 sandbox with egress/resource limits, and scanner management should be permission-gated (RBAC verb exists). The old code's "never DB-stored commands" stance (0015) was the correct call _for host execution_; the container is what makes the PRD's model safe.
4. **Deterministic scanners on arbitrary user projects**: current runner scripts assume this monorepo's tooling (`vp`, fallow configs). Generic projects need plain commands (`npx eslint`, `oxlint`) — reinforces the `scanner_command` model but means the four built-in scanner scripts become CodePulse-repo-specific scanner definitions, not platform primitives.
5. **Clean-break mechanics**: with no data migration required, consider re-baselining the 26 migrations into a fresh initial schema for the v2 model vs stacking migration 0027+. Stacking preserves provenance; re-baselining is cleaner. **Owner preference.**
6. **Snapshot limits/retention**: max upload size, ignore-rule defaults (`node_modules`, `.git` unless §14.1 metadata), disk quota per project.

---

_Report generated from four parallel audit passes over 27 ADRs, 13 TECH_SPEC sections, the legacy PRD, and verified code citations; synthesis spot-checked migrations 0015/0021 and the deterministic scanner config map directly._
