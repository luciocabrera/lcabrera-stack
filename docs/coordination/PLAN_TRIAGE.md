# Plan triage — what the out-of-git scratch files were

`~/.claude/plans/` accumulated **17 files with opaque, auto-generated names**
(`task-four-independent-vast-galaxy.md`, `the-virtuallist-is-a-zazzy-charm.md`, …),
each private to the agent that wrote it and unreadable to anyone else. This ledger
de-opacifies them: what each was, and where it ended up.

**Read this as a convenience map, not an authority.** The plan files are out-of-git
scratch — they can be deleted once their owner confirms the "landed" column. Only
one describes live work (`task-four…`, now [`tasks/table-ui-fixes.md`](./tasks/table-ui-fixes.md));
the rest shipped and their durable residue is the ADR / STATUS entry / code named below.
"likely done" means the topic clearly graduated but I did not trace every commit —
confirm before deleting.

| Plan file (`~/.claude/plans/`)                            | What it was                                            | Status      | Landed as                                                     |
| --------------------------------------------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------- |
| `task-four-independent-vast-galaxy.md`                    | Four independent fixes in `packages/ui` Table          | **active**  | → [`tasks/table-ui-fixes.md`](./tasks/table-ui-fixes.md)      |
| `now-let-s-proceed-with-sharded-boole.md`                 | Component Improvement Plan (fallow-flagged components) | **open**    | Track 1 done; **WP2** (`no-habit-return-types` rule) deferred |
| `round-5-idempotent-lightning.md`                         | Grid Interaction Architecture (ratified for ADRs)      | graduated   | ADR-011 (react-router, grid) · PR #27 `feat_table_future`     |
| `the-virtuallist-is-a-zazzy-charm.md`                     | Serializable filter-options fetch descriptors          | graduated   | ADR-009 (react-router)                                        |
| `our-pr-is-faling-snug-wigderson.md`                      | CLI push + per-user revocable API tokens               | graduated   | ADR-029 (cqms)                                                |
| `we-do-have-a-ticklish-petal.md`                          | Replace client `document.cookie` write with the action | graduated   | ADR-010 (react-router, persist-cookie)                        |
| `the-ci-cd-is-cheerful-storm.md`                          | Reproduce CI's non-Fallow gates locally                | graduated   | `check:safe` chain + COMMANDS.md                              |
| `can-you-exmplain-the-glimmering-bonbon.md`               | CQMS "upload from browser" alignment review            | graduated   | `docs/cqms/` review + STATUS.md (CodePulse pivot)             |
| `codepulse-fallow-handover.md`                            | Fallow-gate ↔ CodePulse pivot handover                 | done        | superseded by `docs/cqms/STATUS.md`                           |
| `fallow-audit-gate-remediation-2026-07-16.md`             | Fallow audit gate for PR #23                           | done        | PR #23 merged (`feat_cqm` → `main`)                           |
| `run-the-vp-run-wobbly-creek.md`                          | Scope Biome rule off for test files                    | done        | branch `fix/biome-component-export-rule-tests` (merged)       |
| `let-s-run-npx-fallow-fizzy-fern.md`                      | Fallow cleanup — `packages/ui` (+ data-access)         | done        | dead-code 57→0; conventions in PATTERNS.md/.fallowrc          |
| `what-are-the-left-robust-llama.md`                       | Fix the one VITAL fallow finding in `packages/ui`      | done        | folded into the fallow cleanup above                          |
| `read-the-pinsidemodal-happy-minsky.md`                   | Extract a generic `ChoiceModal` from pin/order modals  | likely done | Table pinning work (`feat_table_future`, merged)              |
| `let-s-try-to-improve-ticklish-rose.md`                   | Reduce `persistCookie.action` complexity               | likely done | persist-cookie util extraction (ADR-010 area)                 |
| `proud-tickling-swing.md`                                 | Unify VirtualSelect/VirtualList nested providers       | likely done | VirtualList work in `packages/ui`                             |
| `replace-the-str-replace-editor-text-with-cozy-muffin.md` | Friendly tool-call labels in the chat                  | unknown     | agent-runner/chat — confirm with owner                        |

## Loose ends (untracked, no plan file)

- **Branch `fix/table-refresh-layout-shift`** — 1 unmerged commit (`try`, 2026-07-17),
  touches `packages/ui/src/components/Table/TableBody/TableBody.stylex.ts`. Owner
  unknown, no task file. It sits inside the `table-ui-fixes` area lock, so it's
  covered defensively — but its owner should either **claim it** (a task file) or
  **delete the branch**. Flagged here so it doesn't become the next opaque orphan.
