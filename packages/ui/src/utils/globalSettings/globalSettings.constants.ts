export const GLOBAL_SETTINGS_COOKIE_KEY = 'global-settings';
export const GLOBAL_SETTINGS_COOKIE_VERSION = 1;

export const PIN_SIDE_VALUES = ['closest-edge', 'left', 'right'] as const;

export const NAVIGATION_SIZE_VALUES = [
  'compact',
  'large',
  'medium',
  'small',
] as const;

export const NAVIGATION_COLLAPSED_VALUES = ['collapsed', 'expanded'] as const;

export const PIN_CONFLICT_VALUES = [
  'move-column',
  'pin-all-between',
  'pin-only',
] as const;

export const ORDER_CONFLICT_VALUES = [
  'pin-to-match-order',
  'remove-conflicting-pins',
  'reset-all-pins',
] as const;

export const UNPIN_CONFLICT_VALUES = [
  'reorder-to-fill',
  'unpin-beyond',
] as const;
