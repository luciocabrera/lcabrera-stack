# ADR-011: Grid Interaction Architecture (Capability / Command / Surface)

**Status:** Accepted

## Context

A review that began as "should the column resize handle be keyboard-focusable?"
escalated once the roadmap (grouping, nested headers, row selection, command
palette, context menu, toolbar, touch) came into view. Mapping the Table against
the code surfaced a general gap, of which resize was only the loudest — and the
least representative — instance:

- **Every column capability is already exposed through multiple surfaces.** Pin,
  Sort, and Resize each ship through **3** surfaces (header menu, per-column
  drawer, table-settings drawer); Hide and Filter through 2.
- **There is no capability/command layer.** The ~46 capability action hooks are
  bare effect closures with **zero metadata** — no id, label, icon,
  `isEnabled`, or shortcut.
- **Identity and enablement are re-declared per surface.** `"Pin Left"` + its
  `side === 'left'` derivation are copied across the header and the drawer;
  `EraserIcon` is imported into ~10 files; each toolbar recomputes its own
  `hasSorting`/`hasPinning`/`hasClearableState`.
- **One capability is already consolidated** — `ColumnWidthPresetButtons` +
  `useColumnWidthPresetToggle` (`Table/shared/`) — proving the pattern works in
  miniature, in this codebase.

Resize is continuous, perceptual, and the only capability with a
direct-manipulation surface. Designing the interaction model around it (four
prior rounds did) is designing around the edge case. The architecture must be
designed against the whole capability set.

The full command-registry pattern (VS Code / Figma) is the eventual correct
answer for a public grid that will grow a command palette. But the code shows
its headline machinery would **relocate** complexity rather than remove it now:
handlers are React hooks, so a runtime `command.run(target, ctx)` cannot exist
(Rules of Hooks forbids selecting a hook per call); presentation genuinely
diverges per surface; and commit-context (live vs. draft) and interaction policy
(silent vs. confirm) stay surface-owned. The measured duplication is only
**identity + enablement**, which a much smaller intervention removes.

## Decision

Adopt a three-layer model, and **build only its foundation now**, deferring the
registry until a surface that iterates commands generically exists.

**The model.**

- **Capability** — owns a capability's _effect_ and its _availability rules_,
  defined once (pinning, sorting, sizing, visibility, filtering, order; later
  grouping).
- **Command** — a named, targeted intent that binds a capability to a
  _commit-context_. Commit-context ∈ `{ live, draft, preview }` and is a
  **static property of the surface** (the header is always live, a drawer always
  draft), because handlers are hooks and cannot be selected at call time.
- **Surface** — translates a gesture into a command, and owns **presentation +
  interaction policy** (silent vs. confirm, preview vs. commit, focus). A surface
  never re-derives a capability's identity, availability, or effect.

**Governing principle.**

> Capabilities own their effect and their availability rules, defined once.
> Commands are named, targeted intents that bind a capability to a
> commit-context. Surfaces translate gestures into commands and own presentation
> and interaction policy — but never re-derive a capability's identity,
> availability, or effect.

**What is built now (the foundation).** Per-capability **descriptor constants**
(identity) plus **centralized enablement/active-state derivation**. Handlers stay
as the existing action hooks — no adapters, no bus. The minimal descriptor:

```ts
type CommandId = string & { readonly __brand: 'CommandId' };
type CommandDescriptor = {
  readonly id: CommandId;
  readonly label: string; // plain string — no i18n exists in the repo
  readonly icon: ComponentType<IconProps>; // component; surfaces project to <Icon size=… />
};
```

The descriptor is an **overridable default**: centralize identity only where the
command is genuinely the same across surfaces (pinning "Pin Left" is identical;
per-column vs. bulk width are _different_ operations sharing a widget, and
correctly keep their own copy).

**Enablement/active-state is a per-context selector hook, never a descriptor
field.** Putting `isEnabled` on a plain object would force a coarse store
snapshot and defeat the granular `useSyncExternalStore` subscriptions (ADR-003).
It must be a hook (or a pure predicate fed by hooks) that sources from the
surface's own store — **draft-wired for a drawer, live-wired for the header** —
or the drawer renders stale state, because a drawer's draft genuinely diverges
from committed state while open.

**Accessibility lives in both layers.** The command owns the semantic contract
(name, availability, intended shortcut) → keyboard reachability and
announceability are guaranteed at the command layer. The surface owns ARIA
mechanics (role, focus). Consequently the resize splitter's focusability becomes
a stakes-free progressive-enhancement choice: keyboard access to width is
provided by the menu/palette command regardless (this retires the Round 1–4
debate and the WCAG-2.5.7 pressure on the splitter — see ADR-012).

**Target abstraction.** Commands target `column | group | range | selection |
row`. Column/group/range widen the already collection-shaped resolvers
(visibility is a `Set`, sorting/order are arrays); **row and selection are
net-new addressing** with no current representation — they are not free.

**Deferred until a triggering surface exists (registry promotion).** The
iterable command registry, a `CommitContext`/`runners` map, per-command adapter
hooks, keymaps, and the command palette / context menu are **not** built now.
Promotion triggers: a command-iterating surface (palette or context menu) is
actually being built, **or** a third capability proves the `runners` indirection
pays for itself.

## Consequences

- **Validation.** The foundation is proven by a first slice (pinning: header
  live + drawer draft) **and cross-checked against sorting** before it is
  declared general — pinning is the only capability with multi-outcome conflict
  machinery, so validating on it alone would risk over-fitting. If sorting
  cannot adopt the descriptor type unchanged, the shape is revised before any
  further capability.
- **Registry promotion has a known, bounded cost.** ~32 of 46 action hooks are
  thin (store read → pure resolver → `store.set`); ~14 are moderate because
  their "write" is a React-Router `fetcher.submit` keyed by `useLocation()` (the
  cookie-persist primitive, ADR-010). A future palette cannot call `useFetcher`
  per command, so promotion must give that persist primitive a **non-hook
  form**. This is one shared plumbing problem, not per-hook. No action hook is
  ref/effect-entangled; the only Tier-3 code (`useColumnDragSession`,
  `useColumnResize`) is quarantined in `hooks/` and _consumes_ the action layer.
- **The foundation does not fight promotion.** The effectful `commitResolved*`
  utils already take stores + persist as injected parameters, and
  `applyToggleColumnPinResolution` takes its sibling actions as injected
  callbacks — descriptors resolve to that pure/DI layer, so building descriptors
  now adds no coupling that later extraction must undo.
- **i18n is a recorded breaking-change risk.** No internationalization exists
  anywhere in the monorepo, so `label` is a plain string. Because the package is
  going public, a string label becomes API and retrofitting i18n later is a
  breaking change to the descriptor — accepted deliberately.
- **Public-API boundary is stated, not yet enforced.** This ADR treats the
  package as **integrated** (the assembled `TableLayout` is the public surface).
  But `package.json` `exports` wildcards (`./components/*`, `./contexts/*`,
  `./hooks/*`) currently make every internal hook/selector/context
  deep-importable with no enforcement. Closing that leak is a separate issue to
  resolve before the descriptor layer becomes de-facto public API; a headless
  split would revisit the surface/target sections above.
- **Two known fragilities are documented, not silently inherited.** (1) The
  pinning conflict resolution diverges by surface — silent reorder in the header
  vs. confirmation modal in the column-order editor. This must be restated as
  _explicit interaction policy with a reason_; if no reason survives, it is a bug
  to fix. (2) The `auto-accept-*` arms of `applyToggleColumnPinResolution` carry
  an implicit ordering contract (`setPinSideModal` must run before
  `acceptPinSide`, which bails if the modal is absent) that the discriminated
  union does not express.
- **Relationship to prior ADRs.** Builds on the store pattern (ADR-003) and its
  granular subscriptions; consistent with React-Compiler-owned memoization
  (ADR-004); the cookie-persist path (ADR-010) is the shared persistence tail
  named above. ADR-012 is the first instance of this architecture.
