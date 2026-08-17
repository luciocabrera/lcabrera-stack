# StatusBadge Architecture

Small, generic pill badge — a label plus one of five semantic tones. Built
as its own component rather than a `Tag` extension: `Tag` is hard-coupled to
`onRemove` (always renders a remove button), which doesn't fit a read-only
status indicator.

## Public API

- `StatusBadge` — `label: string`, `tone: 'error' | 'info' | 'neutral' | 'success' | 'warning'`.

This component has **no opinion on what a tone means** for any given
domain — it just renders the label in that tone's colors. Mapping a
domain-specific status string (e.g. CQMS's `queued`/`running`/`succeeded`/
`failed`/`partially_failed`/`canceled`) to a tone is the consuming app's own
util owned by the consuming route,
not this component's concern — the same boundary `AppNavigation` draws for
its own route items.

## File Structure

- `StatusBadge.component.tsx` — renders `<span>` with `styles.badge` + the tone variant
- `StatusBadge.stylex.ts` — base pill styles + one variant per tone, reusing the shared `colors` design tokens (`errorBackground`/`errorText`, etc.)
- `StatusBadge.types.ts` — `StatusBadgeProps`, `StatusBadgeTone`
- `StatusBadge.test.tsx` — one test per tone
- `index.ts` — barrel: component + both types
