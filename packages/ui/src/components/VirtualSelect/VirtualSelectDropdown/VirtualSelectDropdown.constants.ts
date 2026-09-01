export const DROPDOWN_GAP_PX = 12;

export const HAS_POPOVER_SUPPORT =
  typeof HTMLElement !== 'undefined' &&
  typeof HTMLElement.prototype.showPopover === 'function';
