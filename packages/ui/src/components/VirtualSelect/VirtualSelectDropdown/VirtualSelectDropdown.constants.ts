/**
 * The gap between trigger and dropdown, in CSS pixels. It mirrors `spacing.sm`
 * — the `marginTop` the dropdown used to get from flow layout. A top-layer
 * dropdown is positioned from JS, and a StyleX var is not readable from JS, so
 * the value has to exist as a number here.
 */
export const DROPDOWN_GAP_PX = 12;

/**
 * Whether this environment implements the Popover API, and so can be asked for
 * the top layer. Detected rather than assumed because partial support exists
 * and is worse than none: jsdom applies the `[popover]` UA rule — `display:
 * none` until the popover is open — but ships no `showPopover` to open it
 * with, so an unconditional attribute makes the list permanently invisible.
 * Without the attribute the dropdown still positions correctly; it just falls
 * back to being clippable, which is where it started.
 *
 * Read once at import. Safe for SSR: a floating dropdown only exists after a
 * click, so the server never renders one and hydration has nothing to desync.
 */
export const HAS_POPOVER_SUPPORT =
  typeof HTMLElement !== 'undefined' &&
  typeof HTMLElement.prototype.showPopover === 'function';
