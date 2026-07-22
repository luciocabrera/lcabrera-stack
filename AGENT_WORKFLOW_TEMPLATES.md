# 📘 `AGENT_WORKFLOW_TEMPLATES.md`

## 🔥 PURPOSE

This file defines **mandatory templates and rules** for creating Issues, Pull
Requests, and Merge Checklists in this repository. All coding agents MUST follow
these templates exactly. All generated issues and PRs MUST use these formats
without omission.

This file also defines **explicit instructions** for agents to place templates in
the correct repository paths and update documentation automatically.

---

## ✅ ADOPTION STATUS — READ THIS FIRST

Adopted. The generated files are live and are what agents actually use:

| Spec section | Lives at                                                                               |
| ------------ | -------------------------------------------------------------------------------------- |
| Section 1    | [`.github/ISSUE_TEMPLATE/standard_issue.md`](.github/ISSUE_TEMPLATE/standard_issue.md) |
| Section 2    | [`.github/pull_request_template.md`](.github/pull_request_template.md)                 |
| Section 3    | [`docs/merge_checklist.md`](docs/merge_checklist.md)                                   |
| Sections 4–5 | [`docs/agent_workflow.md`](docs/agent_workflow.md)                                     |

**Where the generated files and this spec disagree, the generated files win.**
They are what CI reads. Two deviations were necessary; both are recorded here so
no future agent "restores" the spec text and breaks the build.

### Deviation 1 — the PR template's `## What` and `## Verification` headings stay plain

Section 2 spells these `## **📝 1. What**` and `## **🔬 3. Verification**`. This
repository has enforced those two sections since before this spec existed:
`scripts/lib/commit-convention.mjs` matches them with `/^#{1,6}\s+what\b/im`, run
on every PR by `.github/workflows/pr-standards.yml`.

The decorated spelling does not match — after `## ` comes `**📝 1.`, not `what`.
Verified against the real validator:

```
PROPOSED headings → missing `## What`, missing `## Verification`   ❌
PLAIN headings    → {"errors":[],"warnings":[]}                     ✅
```

Adopting Section 2 verbatim would therefore fail the PR Standards check on every
future PR — including the one that introduced it. The template keeps all eight
sections and the plain spelling for those two headings only; the other six carry
whatever formatting you like.

The alternative — loosening the regex to accept any prefix — was rejected: it
weakens the only mechanism enforcing that PRs state what changed and how it was
checked, in order to accommodate decoration.

### Deviation 2 — `coordination:claim` tracking issues are exempt from Section 5.1

`vp run coordination:claim --new-issue` opens a tracking issue that links a task
file to the planning board; the task file carries the detail. Requiring the full
eight-section template there would put the repository's own tooling in permanent
violation of its own rule. Human- and agent-authored issues are held to the
template.

### Pre-existing conventions this spec does not replace

Already enforced here, and unchanged:

- **Commit messages and PR titles** — Conventional Commits, one spec at
  [`scripts/lib/commit-convention.mjs`](scripts/lib/commit-convention.mjs),
  enforced by the `commit-msg` hook and `pr-standards.yml`.
- **Branch naming, CI validation, template compliance** — already in place; see
  [`COMMANDS.md`](COMMANDS.md) and [`AGENTS.md`](AGENTS.md).
- **Coordination** — [`docs/coordination/`](docs/coordination/README.md) is the
  in-flight register; GitHub Issues are the durable backlog (ADR-036).

---

# 🧱 SECTION 1 — ISSUE TEMPLATE (STRICT MODE)

Agents MUST create issues using the following structure.

Save this file as:

```
.github/ISSUE_TEMPLATE/standard_issue.md
```

## **📌 Issue Title**

Short, action-oriented summary. Example:
`Fix incorrect pagination logic in DataFetcher`

## **🧭 1. Problem Statement**

Describe the problem or request clearly.

- What is happening or what is needed
- Why this matters
- Which agent/system/module is affected

## **🎯 2. Objective / Desired Outcome**

Define the end state.

- What should be true once resolved
- Expected behavior or output

## **🔍 3. Context & Background**

Provide all relevant context.

- Architecture notes
- Previous attempts
- Related issues/PRs
- Dependencies
- Constraints

## **🐞 4. Reproduction Steps (Mandatory for Bugs)**

1. Step-by-step reproduction
2. Input/environment
3. Expected result
4. Actual result
5. Logs/traces/screenshots

## **⚙️ 5. Scope Definition**

### In Scope

- Explicit list

### Out of Scope

- Explicit list

## **📐 6. Acceptance Criteria**

Binary, testable conditions.

- [ ] Expected behavior implemented
- [ ] No regressions
- [ ] Automated tests added/updated
- [ ] Documentation updated
- [ ] Approach consistent with repository conventions

## **🧩 7. Implementation Notes (Optional)**

Guidance for agents.

## **🔗 8. Related Work**

Links to issues, PRs, docs.

---

# 🚀 SECTION 2 — PULL REQUEST TEMPLATE (STRICT MODE)

Agents MUST create PRs using the following structure.

Save this file as:

```
.github/pull_request_template.md
```

> **See Deviation 1 above.** The `What` and `Verification` headings are kept
> plain in the generated template because CI matches them.

## **📌 Title**

Short, descriptive summary.

## **📝 1. What**

Describe exactly what changed.

- New logic
- Refactors
- Deleted code
- Tests added
- Docs updated

## **💡 2. Why**

Explain the reasoning.

- What problem this solves
- Why this approach
- Why alternatives were rejected
- Alignment with issue acceptance criteria

## **🔬 3. Verification**

Describe how correctness was validated.

- Manual testing steps
- Automated tests
- Edge cases
- Environment
- Logs/screenshots

## **📊 4. Impact Analysis**

Prevent cross-agent breakage.

- Modules affected
- Potential regressions
- Compatibility notes
- Performance considerations
- Security/privacy considerations

## **🧪 5. Test Coverage**

Summary of tests added/updated.

## **📚 6. Documentation Updates**

List updated docs.

## **🔗 7. Linked Issues**

Example: `Resolves #123` / `Related to #456`

## **⚠️ 8. Known Limitations**

Explicitly list limitations.

---

# 🛡️ SECTION 3 — MERGE CHECKLIST (STRICT MODE)

Agents MUST verify all items before merging.

Save this file as:

```
docs/merge_checklist.md
```

## ✔️ **Pre-Merge Requirements**

- [ ] PR description fully completed
- [ ] Issue acceptance criteria satisfied
- [ ] No unexplained deviations from issue scope
- [ ] All tests passing
- [ ] New tests added for new logic
- [ ] No regressions
- [ ] Documentation updated
- [ ] No conflicting approaches introduced
- [ ] Code reviewed by supervising agent or human
- [ ] Impact analysis completed
- [ ] Security/privacy implications reviewed
- [ ] Performance implications reviewed

## 🔒 **Final Merge Gate**

- [ ] PR does NOT revert or contradict previous agent work
- [ ] PR does NOT introduce ambiguity for future agents
- [ ] PR aligns with orchestration rules

> The generated checklist marks each item **[auto]** or **[judgement]** and names
> the CI check that already enforces the automated ones. A hand-ticked copy of a
> machine-enforced check reports the same green whether it was read or skipped.

---

# 🗂 SECTION 4 — FILE PLACEMENT RULES FOR AGENTS

Agents MUST place files exactly as follows:

```
.github/
  ISSUE_TEMPLATE/
    standard_issue.md
  pull_request_template.md

docs/
  merge_checklist.md
  agent_workflow.md
```

Agents MUST NOT create additional templates unless instructed.

---

# 🛠 SECTION 5 — AGENT EXECUTION RULES

## **1. When creating an Issue**

- Use `standard_issue.md` structure
- Fill ALL fields
- Include full context
- Include reproduction steps for bugs
- Include acceptance criteria
- Link related issues/PRs

_(Exempt: `coordination:claim --new-issue` tracking issues — Deviation 2.)_

## **2. When creating a PR**

- Use `pull_request_template.md`
- Fill ALL sections
- Provide verification steps
- Provide impact analysis
- Link the issue
- Update documentation

## **3. When merging**

- Use `docs/merge_checklist.md`
- Check ALL boxes
- Abort merge if ANY item fails

## **4. When updating documentation**

Agents MUST update:

```
docs/agent_workflow.md
docs/merge_checklist.md
README.md (if relevant)
```

Documentation MUST reflect new behavior, constraints, patterns and agent rules.

> Scope note: update `agent_workflow.md` when the _workflow_ changes and
> `merge_checklist.md` when the _merge bar_ changes. Per-artifact documentation
> follows the Documentation Update Rule in [`AGENTS.md`](AGENTS.md), which names
> the specific homes (`ARCHITECTURE.md`, `INVENTORY.md`, `PATTERNS.md`, ADRs).

## **5. When modifying existing code**

Agents MUST:

- Preserve existing architectural patterns
- Avoid switching approaches (A ↔ B)
- Document reasoning in PR
- Add tests for new logic
- Avoid regressions

## **6. When detecting ambiguity**

Agents MUST:

- Stop
- Create a clarification issue
- Request human or supervising agent input

---

# 🧩 SECTION 6 — AGENT PROMPT

## **AGENT EXECUTION PROMPT**

You are an autonomous coding agent working in a multi-agent orchestration
environment. Your responsibilities include creating issues, pull requests,
updating documentation, and merging code safely.

You MUST follow the templates and rules defined in
`AGENT_WORKFLOW_TEMPLATES.md`.

Your mandatory obligations:

1. Use the strict Issue Template for all issues
2. Use the strict PR Template for all pull requests
3. Use the strict Merge Checklist before merging
4. Place files exactly in the required repository paths
5. Update documentation whenever behavior changes
6. Never switch approaches without documenting reasoning
7. Never introduce ambiguity for other agents
8. Never merge without full verification
9. Abort work and request clarification when context is missing

Your output MUST always comply with these templates and rules.
