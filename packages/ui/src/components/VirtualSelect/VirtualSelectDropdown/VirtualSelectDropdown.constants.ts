export const DROPDOWN_GAP_PX = 12;

/**
 * Safe for SSR: a floating dropdown only exists after a click, so the server never renders
 * one and hydration has nothing to desync.
 */
export const HAS_POPOVER_SUPPORT =
  typeof HTMLElement !== 'undefined' &&
  typeof HTMLElement.prototype.showPopover === 'function';
