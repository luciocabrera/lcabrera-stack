# GitHub planning layer — Issues, sub-issues, Milestones & Projects

How this repo uses GitHub's native planning features as the **durable backlog**,
and how that layer relates to the in-git coordination register. The decision and
its rationale are [ADR-036](../decisions/ADR-036-github-planning-layer.md);
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

Four links connect the layers, and **GitHub owns every one of them** — there is
no custom reconciler to maintain (that is deliberate; see ADR-036):

1. **Task → issue.** Every coordination task sets its `issue:` frontmatter field
   (e.g. `issue: #50`) to the backlog item it advances. This is **required** and
   **validated** — `coordination:verify` fails a live task whose `issue:` is
   missing or not a real reference. `vp run coordination:claim` fills it in (and
   self-assigns the issue) for you.
2. **PR → issue.** PRs close issues with `Closes #N` in the description.
3. **Issue/PR → Project.** [`.github/workflows/add-to-project.yml`](../../.github/workflows/add-to-project.yml)
   auto-adds new issues and same-repo PRs to the board.
4. **PR/issue state → Project Status.** [`.github/workflows/project-status.yml`](../../.github/workflows/project-status.yml)
   (script: [`scripts/sync-project-status.mjs`](../../scripts/sync-project-status.mjs))
   moves the Status column so the board tracks reality without anyone dragging
   cards — see [Status automation](#status-automation) below.

There is **no** Project → files sync and **no** bidirectional sync — a files↔Project
reconciler is a maintenance sink and a drift source. (The `BOARD.md` merge-driver
isn't built either, for the same reason; the board is now a gitignored local view
that is never committed, so nothing conflicts — ADR-037.) Note the four links above
are all **GitHub → GitHub or files → GitHub**; nothing writes back to the files.

## Status automation

The board went stale because Status was manual: an agent works in its own tree and
the linked issue sits in **Todo** until a PR appears. `project-status.yml` closes
that gap by reacting to events GitHub already emits (needs the same
`ADD_TO_PROJECT_PAT` secret; without it — fork PRs — it skips and stays green):

| Signal                        | Status      |
| ----------------------------- | ----------- |
| issue **assigned**            | In Progress |
| issue **closed**              | Done        |
| issue **reopened**            | Todo        |
| PR opened/reopened as a draft | In Progress |
| PR **ready for review**       | In Review   |
| PR converted back to draft    | In Progress |
| PR **merged**                 | Done        |
| PR closed unmerged            | Todo        |

For a PR it moves the PR's card **and** every issue the PR closes
(`closingIssuesReferences`), so the backlog issue advances with the work.

The `issue closed` row exists because that path is not enough on its own: an
issue closed **by hand**, or by a PR whose body never wrote `Resolves #n`, keeps
whatever status it had — In Progress, once someone self-assigned it. That is the
worst of the four to be wrong in, because it reads as "taken" and the next agent
skips the work; #249 and #255 sat like that until the trigger was added.
`scripts/lib/project-status.test.mjs` pins every row of this table, and asserts
the workflow actually subscribes to each event the map answers — a mapped
transition nothing listens for is dead code that looks live.

The one transition GitHub can't infer is "I've started but there's no PR yet" — so
**self-assign the issue the moment you pick it up** (`gh issue edit <n> --add-assignee @me`,
which `vp run coordination:claim` does for you at claim time);
that flips it to In Progress immediately. Then a draft PR keeps it there, ready
review moves it to In Review, and merge closes it out — all automatically.

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
6. **Status automation** is handled by [`project-status.yml`](../../.github/workflows/project-status.yml)
   (see [Status automation](#status-automation)), which reuses the same
   `ADD_TO_PROJECT_PAT`. GitHub's built-in Project workflows can stay on as a
   backstop (e.g. item-added → Todo), but the Status transitions are owned by the
   workflow so they behave identically for every contributor.

## Conventions

- **Titles** follow the same Conventional-Commit shape as PRs where it fits
  (`coverage(ui): …`) so issue, branch, and PR read consistently — but
  this is not gate-enforced on issues.
- **Milestones** group a phase or release; **labels** (the existing `app:` / `pkg:`
  / `type:` taxonomy, synced by `sync-labels.yml`) classify scope and kind.
- **Epics** are an issue with children attached as **sub-issues** (not a prose
  checklist) so the progress bar is real.
