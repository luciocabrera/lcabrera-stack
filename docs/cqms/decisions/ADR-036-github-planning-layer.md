# ADR-036: GitHub Issues, sub-issues, Milestones & Projects as the durable planning layer

**Status:** Accepted
**Relates to:** the in-git coordination register (`docs/coordination/`, README + `verify-coordination.mjs`) — this adds a **second, complementary layer** and draws the boundary between them; it does **not** change the register.

## Context

Two different questions get confused because both sound like "tracking work":

1. **Who is touching what, right now, on which branch?** — _in-flight coordination._
   The soft-lock that stops two agents editing the same files blind.
2. **What should happen, eventually, and why?** — _the durable backlog._
   The prioritised list of work that outlives any one branch.

This repo already answers **(1)** well: the in-git register under
`docs/coordination/` — task files whose `area` globs are a soft lock, a generated
`BOARD.md`, and `coordination:verify` gating integrity in CI. Its founding
principle (same as `docs/README.md`) is that **coordination truth lives in git**:
an agent on any branch can read it offline, with no network and no auth, and CI's
`board-sync` check fails the build if it drifts.

It does **not** answer **(2)**. The durable backlog has been scattered across
`docs/cqms/STATUS.md`, ADRs, `PLAN_TRIAGE.md`, and per-agent auto-memory — no
single prioritised, cross-referenced, human-browsable list, and no kanban.

GitHub ships exactly that layer natively: **Issues** (durable work items with
discussion and cross-refs), **sub-issues** (hierarchical epics with a progress
bar), **Milestones** (release/date grouping), and **Projects** (a real kanban /
table / roadmap over issues + PRs). The repo already leans on `gh` for adjacent
automation (`coordination:board:live`, `sync-labels`, `sonar-report`) and already
syncs a label taxonomy to GitHub.

The question this ADR settles: **adopt GitHub's planning features — and if so, how
do they relate to the in-git register without the two becoming rival sources of
truth that drift?**

## Decision

### 1. Two layers, one boundary

| Layer                          | Home                                               | Answers                                          | Read by                                 | Gated by                   |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------ | --------------------------------------- | -------------------------- |
| **In-flight coordination**     | in-git register (`docs/coordination/`)             | who is touching what, on which branch, right now | every agent, **offline on any branch**  | `coordination:verify` (CI) |
| **Durable backlog + planning** | GitHub Issues / sub-issues / Milestones / Projects | what should happen, eventually, and why          | humans + agents **with `gh` + network** | GitHub itself              |

The register stays the **coordination** source of truth; GitHub becomes the
**backlog & planning** source of truth. Neither replaces the other.

### 2. Why the register is _not_ moved to GitHub Issues

The register's value is precisely the properties GitHub Issues lack:

- **Offline, on any branch.** An agent reads `docs/coordination/BOARD.md` with a
  filesystem read — no `gh`, no auth, no network. GitHub state needs all three,
  and is **absent in exactly the automated contexts the register serves**: fork
  PRs (no write token), headless/cron runs (no interactive auth) — the same
  reason `sonar-issue-gate` skips gracefully there.
- **Versioned and CI-gated.** A claim is part of the commit/diff and `board-sync`
  fails the build if `BOARD.md` drifts. A GitHub Project's state is not in the
  commit and cannot be checked that way.
- **The claim travels with the code.** A task file is true _as of a commit_; a
  mutable global issue is not.

So the soft-lock, `area` globs, `board-sync`, and `coordination:verify` **stay
exactly as they are.**

### 3. What we adopt

- **Issues** — the durable backlog (the "what should happen" currently scattered).
- **Sub-issues** — epics decomposed into children with a native progress bar
  (e.g. the coverage rollout, [#50](https://github.com/luciocabrera/vite-react-compiler/issues/50)).
- **Milestones** — release/date/phase grouping.
- **Projects** — a **human** kanban/table/roadmap view. A planning and reporting
  surface for people, **not** a coordination input for agents (they read the git
  register instead).

### 4. The bridge is one-directional and GitHub-owned

The layers connect by **pointing, never by duplicating or syncing bidirectionally**:

- **Task → issue.** The task frontmatter gains an optional `issue:` pointer
  (alongside the existing free-form `pr:` / `plan:`), so a claim that picks up a
  backlog item links back to it. Optional and unvalidated — same convention as
  `pr:`; the register schema is unchanged.
- **PR → issue.** PRs close issues the normal way (`Closes #N`).
- **Issue/PR → Project.** `.github/workflows/add-to-project.yml`
  (`actions/add-to-project`) auto-adds new issues and PRs to the board. **GitHub
  owns this sync**, so there is **zero bespoke sync code to maintain**. The job is
  guarded by `if: vars.PROJECT_URL != ''`, so it stays inert until the board is
  configured (see §5) and then activates with no code change.

### 5. Projects automation needs an owner-granted scope

GitHub Projects v2 mutations require the `project` scope, which the default
Actions `GITHUB_TOKEN` does **not** carry. Standing up the board is therefore a
**one-time owner step**, tracked in
[#56](https://github.com/luciocabrera/vite-react-compiler/issues/56) and documented
in `docs/tooling/github-planning.md`: grant the scope
(`gh auth refresh -s project,read:project`), create one Project, then set the repo
`PROJECT_URL` variable + `ADD_TO_PROJECT_PAT` secret. Until then, Issues,
sub-issues, and Milestones are fully usable; only the auto-add-to-board step waits.

## Consequences

- **Humans get a real backlog and kanban**; agents are **completely unaffected** —
  they keep reading the git register offline, and CI gating is unchanged.
- **No new bespoke tooling.** The only moving part we own is one stock Action
  invocation and a one-line optional frontmatter field. GitHub owns the issue↔PR↔
  board wiring, so there is nothing new to keep under the script-size / Sonar
  gates.
- **No bidirectional sync — by design.** A files↔Projects reconciler is explicitly
  rejected: it is a maintenance sinkhole and a fresh drift source, the same class
  of problem as the `BOARD.md` merge-driver the register deliberately does **not**
  build. Sync stays one-way and GitHub-owned.
- **`STATUS.md` stays canonical for CQMS status.** This layer does not mirror it
  wholesale; specific actionable items graduate to issues when they need a prioritised
  home, the way a plan's _claim_ graduates to a task file.
- **One manual cost:** the owner-granted `project` scope + PAT/variable in §5.

## Alternatives rejected

- **Replace the git register with GitHub Issues.** Regresses the offline, on-branch,
  CI-gated coordination the register exists to provide — invisible to fork/headless
  agents. Rejected.
- **Bidirectional file↔Project sync.** Maintenance burden + guaranteed drift; the
  merge-driver lesson. Rejected in favour of the one-way bridge.
- **Do nothing.** Leaves the durable backlog scattered and invisible, which is the
  problem this solves. Rejected.
