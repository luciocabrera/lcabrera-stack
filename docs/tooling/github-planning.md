# GitHub planning layer — Issues, sub-issues, Milestones & Projects

How this repo uses GitHub's native planning features as the **durable backlog**,
and how that layer relates to the in-git coordination register. The decision and
its rationale are [ADR-036](../cqms/decisions/ADR-036-github-planning-layer.md);
this page is the operational runbook.

## The two layers (don't confuse them)

|              | In-flight coordination                                              | Durable backlog & planning                         |
| ------------ | ------------------------------------------------------------------- | -------------------------------------------------- |
| **Home**     | in-git register — [`docs/coordination/`](../coordination/README.md) | GitHub Issues / sub-issues / Milestones / Projects |
| **Answers**  | who is touching what, on which branch, **right now**                | what should happen, eventually, and **why**        |
| **Read by**  | every agent, **offline on any branch**                              | humans + agents with `gh` + network                |
| **Gated by** | `coordination:verify` (CI)                                          | GitHub itself                                      |

The register is **not** moving to GitHub — an agent on a fork or a headless/cron
run has no `gh` auth, but can always read the task files under
`docs/coordination/tasks/` from the filesystem (`vp run coordination:board`
renders them as a local table). GitHub covers the layer the register never did:
the prioritised, cross-referenced, human-browsable backlog and a kanban.

## What lives where

- **Issue** — one durable work item (a bug, a chore, a feature). The "what should
  happen" that outlives any branch.
- **Sub-issue** — a child of an epic issue, with a native progress bar. Use for
  phased rollouts (the coverage rollout epic is
  [#50](https://github.com/luciocabrera/vite-react-compiler/issues/50), children
  #51–#55).
- **Milestone** — release / date / phase grouping (e.g. _Coverage rollout —
  Phase 3_).
- **Project** — the human kanban / table / roadmap **view** over issues + PRs. A
  planning and reporting surface for people; agents still coordinate via the git
  register.

## The bridge — one-way, no bespoke sync

Three links connect the layers, and **GitHub owns every one of them** — there is
no custom reconciler to maintain (that is deliberate; see ADR-036):

1. **Task → issue.** A coordination task that picks up a backlog item sets its
   optional `issue:` frontmatter field (e.g. `issue: #50`). Free-form, unvalidated
   — same as `pr:`.
2. **PR → issue.** PRs close issues with `Closes #N` in the description.
3. **Issue/PR → Project.** [`.github/workflows/add-to-project.yml`](../../.github/workflows/add-to-project.yml)
   auto-adds new issues and same-repo PRs to the board.

There is **no** Project → files sync and **no** bidirectional sync — a files↔Project
reconciler is a maintenance sink and a drift source. (The `BOARD.md` merge-driver
isn't built either, for the same reason; the board is now a gitignored local view
that is never committed, so nothing conflicts — ADR-037.)

## One-time setup — activating the Project board

The board is the only piece that needs owner-level access: Projects v2 mutations
require the **`project` scope**, which the default Actions `GITHUB_TOKEN` does not
carry. Tracked in
[#56](https://github.com/luciocabrera/vite-react-compiler/issues/56). Until it is
done, Issues / sub-issues / Milestones work fully; only auto-add-to-board waits.

1. **Grant the scope** to your `gh` token:
   ```
   gh auth refresh -s project,read:project
   ```
2. **Create one Project** named `Planning` and copy its URL, e.g.
   `https://github.com/users/luciocabrera/projects/N`:
   ```
   gh project create --owner luciocabrera --title Planning
   ```
3. **Create a fine-grained PAT** with `read:project` + `project` (write) on this
   repo, and add it as the repo **secret** `ADD_TO_PROJECT_PAT`. (The default
   `GITHUB_TOKEN` can't write Projects v2, so the workflow authenticates with this
   PAT instead.)
4. **Set the repo variable** `PROJECT_URL` to the Project URL from step 2:
   ```
   gh variable set PROJECT_URL --body "https://github.com/users/luciocabrera/projects/N"
   gh secret set ADD_TO_PROJECT_PAT   # paste the PAT
   ```
   The workflow is gated `if: vars.PROJECT_URL != ''`, so it stays inert (green,
   skipped) until `PROJECT_URL` is set, then activates with no code change.
5. **Backfill** the already-open issues onto the board once (UI "Add items", or
   `gh project item-add <N> --owner luciocabrera --url <issue-url>`).
6. **(Optional) Built-in workflows** on the Project: auto-move items to **Done**
   when their linked PR merges / issue closes; auto-set status to **In progress**
   when a PR is opened.

## Conventions

- **Titles** follow the same Conventional-Commit shape as PRs where it fits
  (`coverage(admin_system): …`) so issue, branch, and PR read consistently — but
  this is not gate-enforced on issues.
- **Milestones** group a phase or release; **labels** (the existing `app:` / `pkg:`
  / `type:` taxonomy, synced by `sync-labels.yml`) classify scope and kind.
- **Epics** are an issue with children attached as **sub-issues** (not a prose
  checklist) so the progress bar is real.
- **`STATUS.md` stays canonical** for CQMS built-vs-spec status; graduate a
  specific actionable item to an issue when it needs a prioritised home, rather
  than mirroring the whole page.
