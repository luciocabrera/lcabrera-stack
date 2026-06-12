---
name: code-smell-zen
description: Scan git diff vs target branch for code smells (Clean Code + GoF + TypeScript/React catalog)
argument-hint: '[target-branch]'
allowed-tools: Bash(cat:*,date:*,git:*,mkdir:*,tee:*), Read, Grep, Glob
license: MIT
metadata:
  version: '1.0.0'
  scope: [root]
---

# /smell — Code smell review

You are running a 5-step code-smell review. Follow the steps **in order**. Do not skip any. Do not invent findings. Cite catalog IDs verbatim from the lists below.

---

## Step 1 — Ingest

The diff below has already been collected. Read it carefully before proceeding. It contains both the committed changes vs the base (3-dot `base...HEAD`) **and** the working-tree changes (staged + unstaged).

!`bash -c '
BASE="$1"
if [ -z "$BASE" ]; then
  BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed "s@^refs/remotes/@@")
  [ -z "$BASE" ] && BASE="origin/main"
  git rev-parse "$BASE" >/dev/null 2>&1 || BASE="main"
  git rev-parse "$BASE" >/dev/null 2>&1 || BASE="HEAD"
fi
if ! git rev-parse "$BASE" >/dev/null 2>&1; then
  echo "ERROR: base $BASE not found. Pass an explicit branch: /smell <branch>"
  exit 1
fi
echo "===== BASE: $BASE ====="
echo
if [ "$BASE" = "HEAD" ]; then
  echo "(No remote or base branch found — showing full working-tree diff against HEAD)"
  echo
  echo "----- Stat (staged + unstaged) -----"
  git diff --stat HEAD || true
  echo
  echo "===== Working-tree diff (staged + unstaged, -U10) ====="
  git diff -U10 HEAD || true
else
  echo "----- Stat (committed vs $BASE) -----"
  git diff --stat "$BASE"...HEAD || true
  echo
  echo "----- Stat (working tree, staged+unstaged) -----"
  git diff --stat HEAD || true
  echo
  echo "===== Committed diff (vs $BASE, -U10) ====="
  git diff -U10 "$BASE"...HEAD || true
  echo
  echo "===== Working-tree diff (staged + unstaged, -U10) ====="
  git diff -U10 HEAD || true
fi
' -- "$ARGUMENTS"`

> **VS Code Copilot:** The `!bash` prefix does not auto-execute in this environment. Run the command above manually via `run_in_terminal` from the repository root (`/home/lucio/workspaces/vite-react-compiler`) before proceeding to Step 2.

---

## Step 2 — Classify

Pick **exactly one** category for the overall change and justify in **one sentence**:

- `feature` — new user-visible behavior, endpoints, UI, or capability
- `refactor` — internal restructure, no behavior change
- `bugfix` — corrects incorrect behavior
- `test` — tests-only
- `docs` — docs/comments only
- `config` — config / build / infra only
- `mixed` — multiple of the above; name the dominant one

---

## Step 3 — Weight the lens

Decide whether to emphasize **Clean Code**, **Gang of Four**, or **Mixed**. State your choice and a one-sentence rationale.

Heuristic:

- Diff introduces new classes / hierarchies / abstractions / extension points → **Gang of Four lens**.
- Diff is mostly inline edits, naming, function shape, duplication → **Clean Code lens**.
- Both → **Mixed**.

### Clean Code reminder (Robert C. Martin, 2008)

- **Functions**: small, do one thing, one level of abstraction (G34), ≤3 args (F1), no boolean flag args (F3), no output args (F2).
- **Names**: reveal intent (N1), unambiguous (N4), longer for longer scopes (N5), describe side effects (N7).
- **Comments**: explain _why_ not _what_; delete obsolete (C2), redundant (C3), commented-out (C5).
- **General**: duplication is the worst smell (G5); polymorphism over switch (G23); encapsulate conditionals (G28); avoid Law-of-Demeter violations (G36); replace magic numbers with named constants (G25).
- **Tests**: F.I.R.S.T. — Fast, Independent, Repeatable, Self-validating, Timely; test boundary conditions (T5).

### Gang of Four reminder (Gamma/Helm/Johnson/Vlissides, 1994; design smells from Martin)

- **23 patterns** in three groups:
  - **Creational**: Abstract Factory, Builder, Factory Method, Prototype, Singleton.
  - **Structural**: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy.
  - **Behavioral**: Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor.
- **Two core rules**: _program to an interface, not an implementation_; _favor object composition over class inheritance_.
- **SOLID**: SRP, OCP, LSP, ISP, DIP.
- **Seven design smells (Martin)**: rigidity, fragility, immobility, viscosity, needless complexity, needless repetition, opacity.
- **Pattern-missing signals** (most useful as scanner heuristics):
  - Long if/elif/match on a type-code or enum repeated across methods → **Strategy** or **State**.
  - Client directly instantiates concrete classes from a hierarchy → **Factory Method** or **Abstract Factory**.
  - Subclass explosion combining orthogonal traits (`RedBoldButton`, `BlueBoldButton`…) → **Decorator** or **Bridge**.
  - Polling another object for state changes; hand-rolled listener loops → **Observer**.
  - Two near-identical methods differing in 1–2 steps → **Template Method**.
  - Recursive container handled with `isinstance(x, list)` branches → **Composite**.
  - Inline call-translation to a foreign API surface → **Adapter**.
  - Ad-hoc tuples/dicts representing deferred actions, ad-hoc undo stacks → **Command**.
  - Index-based traversal of a custom collection (`for i in range(c.size())`) → **Iterator**.
  - Clients reach into many internals of one subsystem → **Facade**.

---

## Step 4 — Analyze

Walk every hunk. For each issue you find, cite **exactly one** catalog ID from the lists below. Quote the smallest possible code excerpt. One-sentence _why_. One-sentence _fix_. Don't invent IDs that aren't in this list.

### Clean Code IDs (language-agnostic)

- **CC.C1** Inappropriate Information (non-technical info in comments)
- **CC.C2** Obsolete Comment (doesn't match the code)
- **CC.C3** Redundant Comment (restates what the code says)
- **CC.C5** Commented-Out Code
- **CC.F1** Too Many Arguments (>3)
- **CC.F2** Output Arguments (params mutated as outputs)
- **CC.F3** Flag Arguments (boolean param → function does >1 thing)
- **CC.F4** Dead Function (never called)
- **CC.G5** Duplication (most important smell)
- **CC.G6** Code at Wrong Level of Abstraction
- **CC.G8** Too Much Information (overly wide interface)
- **CC.G9** Dead Code (unreachable branches / unused symbols)
- **CC.G11** Inconsistency (same idea expressed two ways)
- **CC.G12** Clutter (empty ctors, unused vars, useless comments)
- **CC.G14** Feature Envy (method uses another class's data more than its own)
- **CC.G15** Selector Arguments (magic flags that change behavior)
- **CC.G16** Obscured Intent (magic numbers, dense expressions, cryptic names)
- **CC.G19** Use Explanatory Variables (break dense expressions into named intermediates)
- **CC.G20** Function Names Should Say What They Do
- **CC.G23** Prefer Polymorphism to If/Else or Switch/Case
- **CC.G25** Replace Magic Numbers with Named Constants
- **CC.G28** Encapsulate Conditionals (extract booleans into named predicates)
- **CC.G29** Avoid Negative Conditionals
- **CC.G30** Functions Should Do One Thing (SRP at function level)
- **CC.G34** Functions Should Descend Only One Level of Abstraction
- **CC.G36** Avoid Transitive Navigation (Law of Demeter)
- **CC.N1** Choose Descriptive Names
- **CC.N4** Unambiguous Names
- **CC.N5** Use Long Names for Long Scopes
- **CC.N7** Names Should Describe Side-Effects
- **CC.T1** Insufficient Tests
- **CC.T5** Test Boundary Conditions
- **CC.T9** Tests Should Be Fast

### Gang of Four IDs — missing-pattern signals

- **GOF.STRATEGY-MISSING** — long if/elif/match on type-code or enum, repeated across methods.
- **GOF.FACTORY-MISSING** — client `new`s concrete classes from a hierarchy.
- **GOF.DECORATOR-MISSING** — subclass explosion combining orthogonal traits.
- **GOF.OBSERVER-MISSING** — polling, or hand-rolled `for listener in listeners`.
- **GOF.TEMPLATE-MISSING** — two near-identical methods differing in 1–2 steps.
- **GOF.COMPOSITE-MISSING** — recursive container w/ `isinstance(x, list)` branches.
- **GOF.ADAPTER-MISSING** — inline call-translation to a foreign API.
- **GOF.COMMAND-MISSING** — ad-hoc tuples/dicts as deferred actions; ad-hoc undo stacks.
- **GOF.ITERATOR-MISSING** — `for i in range(c.size())` over a custom collection.
- **GOF.FACADE-MISSING** — clients touch many internals of one subsystem.

### Gang of Four IDs — design smells (Martin, _Agile Software Development_)

- **DS.RIGIDITY** — one change cascades widely
- **DS.FRAGILITY** — changes break unrelated parts
- **DS.IMMOBILITY** — components hard to extract for reuse
- **DS.VISCOSITY** — hacks are easier than correct fixes
- **DS.NEEDLESS-COMPLEXITY** — infrastructure not justified by current need
- **DS.NEEDLESS-REPETITION** — same logic in multiple places
- **DS.OPACITY** — hard to understand

### TypeScript and React IDs

- **TS.ANY-LEAK** — `any` leaks type safety across module boundaries.
- **TS.UNSAFE-CAST** — unchecked `as` cast narrows without runtime validation.
- **TS.NON-NULL-ASSERT** — `!` used where nullability is not proven.
- **TS.TS-IGNORE** — `@ts-ignore` suppresses compiler diagnostics without guardrails.
- **TS.DOUBLE-ASSERTION** — `as unknown as T` bypasses structural checks.
- **TS.LOOSY-RECORD** — `Record<string, unknown>` used where key union should exist.
- **TS.MUTATION-EXPORT** — exported mutable object used as shared state.
- **TS.ENUM-SWITCH-DEFAULT** — switch over enum/union relies on default instead of exhaustiveness.
- **TS.IMPLICIT-ANY-CALLBACK** — callback params inferred as any in public APIs.
- **TS.NO-ERROR-DISCRIMINANT** — error state modeled as string instead of discriminated union.
- **TS.PROMISE-WITHOUT-AWAIT** — async call created without await/handling in flow-sensitive code.
- **TS.MAGIC-STRING-UNION-MISSING** — repeated string literals where typed union constant should exist.
- **REACT.HOOKS-ORDER-RISK** — hook call appears in conditional/loop path.
- **REACT.MISSING-DEPS** — hook dependency array omits referenced values.
- **REACT.EFFECT-FETCH-WITHOUT-CANCEL** — server data is fetched in `useEffect` instead of React Router loader/action; if temporary effect-based fetch exists, missing abort/cleanup is a blocker.
- **REACT.KEY-INDEX** — list items keyed by index where stable identity exists.
- **REACT.DERIVED-STATE** — local state duplicates props/computed values and drifts.
- **REACT.SETSTATE-IN-RENDER** — state setter is called during render path.
- **REACT.CONTEXT-OVERBROAD** — single context value causes broad rerenders.
- **REACT.PROPS-MUTATION** — component mutates props or nested prop structures.
- **REACT.INLINE-HANDLER-HOTPATH** — inline handler created repeatedly in hot render paths.
- **REACT.CONTROLLED-UNCONTROLLED-SWITCH** — input toggles between controlled and uncontrolled modes.
- **REACT.EFFECT-STATE-SYNC** — effect used to mirror state derivable during render.

---

## Step 5 — Prioritize & report

### Severity definitions

- **BLOCKER** — security, correctness, data-loss, or runtime-crash risk
- **HIGH** — clearly wrong; will regress maintainability or behavior
- **MEDIUM** — design weakness worth fixing now
- **LOW** — minor; in-passing fix
- **NIT** — style preference, no real cost

Sort findings by severity (desc), then by file path. Emit **exactly this structure** as your final response:

````markdown
# Smell Report

**Base:** `<BASE>`
**Classification:** `<feature|refactor|bugfix|test|docs|config|mixed>`
**Primary lens:** `<Clean Code | Gang of Four | Mixed>`

## Summary

- Files changed: N
- Findings: X blocker, Y high, Z medium, W low, V nit
- Top risk: <one sentence>

## Findings

### [BLOCKER] `REACT.MISSING-DEPS` — `path/Widget.tsx:142`

```tsx
<smallest meaningful excerpt>

**Why:** <one sentence>
**Fix:** <one sentence>

...

## Synthesis

<one paragraph: dominant theme of the diff and the top 3 actions to take before merge>
```
````

If the diff has no findings, emit the same structure with an empty Findings section and an explicit "No catalog findings on this diff." line, plus the Synthesis paragraph.

For cross-skill consistency, align the final response with:

- `../code-smell-shared/SCHEMA_V1.md`
- `../code-smell-shared/REPORT_TEMPLATE.md`
- `../code-smell-shared/TEST_PLAN.md`
- `../code-smell-shared/RULE_FIX_QUICK_REFERENCE.md`

Keep catalog IDs unchanged and normalize only structural fields required by the shared schema.

## Saving the Report

After producing the final report, **always** save it to disk without prompting the user:

1. Capture the current timestamp: `date +%Y%m%dT%H%M%S`
2. Create the output directory: `.tmp/code-smell-zen/<timestamp>/`
3. Write the full report as `report.md` inside that directory, using the same markdown structure emitted in Step 5.
4. Tell the user the path to the saved file.

The directory layout groups all runs of this skill together, with each run in its own timestamped subfolder:

```
.tmp/
└── code-smell-zen/
    ├── 20260612T184056/
    │   └── report.md
    └── 20260615T093012/
        └── report.md
```

Begin now with Step 2.
