# CopyButton Architecture

Icon-only button that copies a string to the clipboard via
`navigator.clipboard.writeText`, with a brief visual confirmation
(icon + tooltip swap to a checkmark/"Copied!") before reverting.

## Public API

- `CopyButton` — `value: string` (what gets copied), `label?: string`
  (tooltip/aria-label before copying, defaults to `'Copy'`).

## Composition

Built entirely from existing design-system pieces — `Button` (icon-only,
`color='ghost'`) and the `CopyIcon`/`CheckIcon` icon components — no new
styling primitive needed. Confirmation state is local `useState` + a plain
`setTimeout` in the click handler (not `useEffect` — there is nothing to
synchronize with an external system here, it's a self-contained timed UI
revert triggered directly by the click).

## File Structure

- `CopyButton.component.tsx` — click handler + icon/label swap
- `CopyButton.types.ts` — `CopyButtonProps`
- `CopyButton.test.tsx` — clipboard call + confirmation revert (fake timers)
- `index.ts` — barrel: component + type
