# Coordination — who is working on what

Several agents and several people work this repository in parallel. This
directory is the **in-git register of work in flight**: the one place that
answers _who is working on what, on which branch, in which files, and what state
is it in_.

It exists because that answer otherwise lives nowhere shared. The only signals
are a branch listing (a name and a commit — no owner, no status, no files) and
each agent's own private scratch, which nobody else can read. That gap is how two
agents end up editing the same code without either of them being able to find
out. Putting the claim in git closes it.

> The governing rule: coordination-relevant truth lives in git, visible to
> everyone. A private store — an agent's scratch directory, its own memory — is
> fine for thinking and is never the shared record.

---

## The protocol (claim before you touch)

Before starting **non-trivial** work — anything beyond a one-file fix you commit
immediately:

1. **Check for collisions.** Run the register gate; it warns when an area you are
   about to claim overlaps an active task. If it does, coordinate with that owner
   or narrow your scope before starting.
2. **Claim it.** Copy [`tasks/_TEMPLATE.md`](tasks/_TEMPLATE.md) to
   `tasks/<id>.md` and fill in the frontmatter — above all the `area` globs,
   which are the soft lock everyone else reads. That file **is** the claim; there
   is no board to regenerate and no second place to update, so two agents
   claiming at once never collide.
3. **Pick a branch.** An independent branch is the default; see below for when to
   share one. The task file is committed **on that branch**, in the same pull
   request as the work — there is no claim-only pull request. Open the pull
   request early, as a draft: it is the progress surface a person can watch.
4. **Keep it current.** Bump `updated:` as you make progress and move `status:`
   through `active → review`. A task nobody has touched in a while is flagged, so
   abandoned work surfaces instead of rotting.
5. **Closing is automatic** where the close-claim workflow is installed: merging
   the pull request deletes the task file. Without it, delete the file yourself in
   the merge commit — a claim nobody holds still reads as a live lock.

The ceremony is one file. The payoff is that nobody collides blind.

## The task file

Every field is checked. `id` must equal the filename, `issue` must name a real
backlog item, and `area` must be at least one glob. The rest of the schema, and
what each value means, is in [`tasks/_TEMPLATE.md`](tasks/_TEMPLATE.md) — it is
the template and the specification in one file, so the two cannot drift.

**Keep `area` as narrow as the work really is.** A wide glob locks more than it
should and makes the overlap warning useless by firing on everything. Prefer a
concrete prefix over a glob that can match at any depth.

## Independent vs shared branches

The default is one branch per task, and overlap between two tasks is then a
collision to resolve.

Sometimes several agents need each other's work in progress. Then they point
their tasks at **one** branch and declare it in `branches/<slug>.md` with an
integrator named. Overlap between tasks on the same declared shared branch is
collaboration, not a collision, and the gate reads it that way.

## What the gate checks

The register gate fails on **integrity** — a task file that does not parse, or
whose frontmatter is missing a required field. That is something the author of
the change controls and can fix.

Everything else is a **warning**: an area overlap, a stale `updated:`, a branch
that no longer exists. Those are signals about the register as a whole, and
failing an unrelated change for one of them would teach everyone to ignore the
gate. They are reported, and they are meant to be read.

## Backlog lives elsewhere

This register is **in-flight work only**. What should happen next — the backlog,
the epics, the milestones — belongs in the issue tracker, and each task links to
its item through the required `issue:` field. The register is never moved there:
a task file is readable offline, on any branch, and the gate can check it.
